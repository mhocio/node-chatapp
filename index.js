const express = require('express');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const socket = require("socket.io");
const {
  checkAuthenticated,
  checkNotAuthenticated
} = require('./controllers/auth.js');

require('dotenv').config();
const port = process.env.PORT || 5000;

const {
  users,
  conversations
} = require('./db-config');

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  users
);

const app = express();
app.use(express.json());

app.set('view-engine', 'ejs');
app.use(express.urlencoded({
  extended: false
}));
app.use(flash());

sess = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 86400000
  },
  resave: false,
  saveUninitialized: true,
  store: new(require("connect-mongo")(session))({
    url: process.env.MONGO_SESSIONS_URI
  })
};
// If secure is set, and you access your site over HTTP, the cookie will not be set
if (process.env.PROTOCOL === 'HTTPS') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}
var sessionMiddleware = session(sess);

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));
app.use(express.static("views"));

// ROUTES
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', {
    name: req.user.name
  });
});

const conversationsRoute = require('./routes/conversations.js')(users, conversations);
app.use('/conversations', conversationsRoute);

const authRoute = require('./routes/auth.js')(passport, '/auth', users);
app.use('/auth', authRoute);

// Error middleware
app.use((error, req, res, next) => {
  let status = 500;
  if (error.status) {
    status = error.status;
  }
  console.log(error);
  res.status(status).json(error.message);
});

// INIT SERVER
const server = app.listen(port, () => {
  console.log('\x1b[36m%s\x1b[0m', `Listening at: http://localhost:${port}`);
});


// Socket setup
const io = socket(server);
io.use(function (socket, next) {
  sessionMiddleware(socket.request, {}, next); // Wrap the express middleware
});
io.on("connection", function (socket) {
  //socket.io.engine.id = socket.request.session.passport.user;
  const {
    socketModule
  } = require('./controllers/socket.js');
  socketModule(io, socket, users, conversations);
  return io;
});