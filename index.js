const express = require('express');
const passport = require('passport');
const monk =  require('monk');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const socket = require("socket.io");

require('dotenv').config();

// users Db
const usersDb = monk(process.env.MONGODB_USERS_URI);
const users = usersDb.get('users');
users.createIndex({ name: 1 }, { unique: true });

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  users
);

const app = express();

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());

var sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new (require("connect-mongo")(session))({
    url: process.env.MONGO_SESSIONS_URI
  }),
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.use(express.static("views"));

const { checkAuthenticated, checkNotAuthenticated } = require('./controllers/auth.js');
  
app.get('/', checkAuthenticated, (req, res) => {
  //console.log("user");
  //console.log(req.user);
  res.render('index.ejs', { name: req.user.name });
});

// let conversations = [];
// app.get('/conversations', (req, res) => {
//   res.send(conversations);
// });

const authRoute = require('./routes/auth.js')(passport, '/auth', users);
app.use('/auth', authRoute);
  
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log('\x1b[36m%s\x1b[0m', `Listening at: http://localhost:${port}`);
});

// Socket setup
const io = socket(server);
io.use(function(socket, next){
  sessionMiddleware(socket.request, {}, next);  // Wrap the express middleware
});

const activeUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", async function (data) {
    const userId = socket.request.session.passport.user;
    const thisUser = await users.findOne({
      id: userId
    });
    console.log("new user");
    console.log(userId)

    socket.userId = thisUser.name;
    activeUsers.add(thisUser.name);
    console.log(activeUsers);

    io.emit("new user", [...activeUsers]);
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.userId);
    console.log("user disconnected");
    io.emit("user disconnected", socket.userId);
  });

  socket.on("chat message", function (data) {
    io.emit("chat message", data);
  });

  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });
});