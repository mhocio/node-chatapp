const express = require('express');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
var helmet = require('helmet');
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

// Use helmet's default security headers. Calling individual feature
// methods can fail across helmet major versions (some helpers were removed).
// Configure Helmet and Content Security Policy to allow required external CDNs and
// a small amount of inline script for the app. This keeps most protections but
// allows the client scripts loaded from trusted CDNs and the inline `userName`
// assignment used in `index.ejs`.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://code.jquery.com",
        "https://stackpath.bootstrapcdn.com",
        "'unsafe-inline'" // used for small inline script and inline handlers in development
      ],
      styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "'unsafe-inline'"],
  connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://code.jquery.com", "https://stackpath.bootstrapcdn.com"],
      imgSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.set('view-engine', 'ejs');
app.use(express.urlencoded({
  extended: false
}));
app.use(flash());

const MongoStore = require('connect-mongo');

// Build the session options object
let sess = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 86400000
  },
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_SESSIONS_URI
  })
};

// Only set secure cookies when PROTOCOL explicitly indicates HTTPS (case-insensitive)
// AND we're running in production. During local development (NODE_ENV !== 'production')
// we should not set secure cookies even if PROTOCOL is set to 'HTTPS' in the env file,
// because the browser will refuse to set them over plain HTTP and auth will fail.
const isHttps = process.env.PROTOCOL && String(process.env.PROTOCOL).toLowerCase() === 'https';
const isProd = process.env.NODE_ENV && String(process.env.NODE_ENV).toLowerCase() === 'production';
if (isHttps && isProd) {
  app.set('trust proxy', 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies only over HTTPS in production
} else {
  sess.cookie.secure = false; // allow cookies over HTTP for development/local runs
}

console.log('Session config: cookie.secure=' + sess.cookie.secure + ' PROTOCOL=' + process.env.PROTOCOL + ' NODE_ENV=' + process.env.NODE_ENV);

const sessionMiddleware = session(sess);

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

// Debug route: returns session and user info for the currently authenticated user.
// Only available when logged in (uses checkAuthenticated).
app.get('/debug-session', checkAuthenticated, async (req, res) => {
  try {
    const user = await users.findOne({ id: req.session.passport.user });
    res.json({ session: req.session, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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