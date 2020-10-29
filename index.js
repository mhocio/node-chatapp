const express = require('express');
const passport = require('passport');
const monk =  require('monk');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const socket = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const { checkAuthenticated, checkNotAuthenticated } = require('./controllers/auth.js');

require('dotenv').config();
const port = process.env.PORT || 5000;

// Db
const usersDb = monk(process.env.MONGODB_USERS_URI);
const users = usersDb.get('users');
users.createIndex({ name: 1 }, { unique: true });

const conversationsDb = monk(process.env.MONGODB_USERS_CONVERSATIONS);
const conversations = conversationsDb.get('conversations');
conversations.createIndex({ id: 1 }, { unique: true });

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  users
);

const app = express();

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());

sess = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 86400000
  },
  resave: false,
  saveUninitialized: true,
  store: new (require("connect-mongo")(session))({
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
  
function Ex(status, name, message) {
  if (status < 0) {
    this.status = 500;
  } else {
    this.status = status;
  }
  this.name = name;
  this.message = message;
}

// ROUTES
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/conversations', checkAuthenticated, async (req, res) => {
  const user = await users.findOne({ id: req.session.passport.user });
  res.send(user.conversations);
});

app.put('/conversations/:conversation/adduser/:name', checkAuthenticated, async (req, res, next) => {
  try {
    const creatorId = req.session.passport.user;
    const { conversation : conversationId, name: newUserName } = req.params;
    const conversation = await conversations.findOne({ id: conversationId });
    const newParticipant = await users.findOne({ name: newUserName });
    const newParticipantId = newParticipant.id;
    console.log(newParticipantId);
    
    if (!conversation) {
      throw new Ex(404, "no such conversation", "error");
    }
    if (creatorId != conversation.owner) {
      throw new Ex(403, "not your conversation", "denied");
    }

    // need to change to atomic operation
    conversations.update( 
      { id: conversationId }, 
        { $addToSet: { "participants": { id : newParticipantId } }},
        (err, result) => {}
    );
    users.update( 
      { id: newParticipantId }, 
        { $addToSet: { "conversations": { id : conversationId } }},
        (err, result) => {}
    );

    res.json('sucess');
  } catch (error) {
    console.log(error);
    next(error);
  }
})

app.post('/conversations', checkAuthenticated, async (req, res) => {
  const creatorId = req.session.passport.user;
  const conversationId = uuidv4();
  var newConversation = {
    id: conversationId,
    participants: [{ id: creatorId }],
    owner: creatorId,
  }

  const createdConversation = await conversations.insert(newConversation);

  const creator = await users.findOne({ id: creatorId });
  console.log(creator);
  if (creator) {
    users.update( 
      { id: creatorId }, 
        { $addToSet: { "conversations": { id : conversationId } }},
        (err, result) => {}
    );
  } else {
    console.log('add these to user?');
  }

  console.log(createdConversation);
  res.send(createdConversation);
});

const authRoute = require('./routes/auth.js')(passport, '/auth', users);
app.use('/auth', authRoute);

// Error middleware
app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? 'e' : error.stack,
  });
});

// INIT SERVER
const server = app.listen(port, () => {
    console.log('\x1b[36m%s\x1b[0m', `Listening at: http://localhost:${port}`);
});

// Socket setup
const io = socket(server);
io.use(function(socket, next){
  sessionMiddleware(socket.request, {}, next);  // Wrap the express middleware
});
io.on("connection", function (socket) {
  const { socketModule } = require('./controllers/socket.js');
  socketModule(io, socket, users, conversations);
  return io;
});