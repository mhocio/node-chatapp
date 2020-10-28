const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const {
  Router
} = require('express');
const {
  checkAuthenticated,
  checkNotAuthenticated
} = require('../controllers/auth.js');

module.exports = function (passport, authPath, users) {
  const router = require('express').Router();

  router.get('/', (req, res) => {
    res.redirect(authPath + '/login');
  });

  router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
  });

  router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: authPath + '/login',
    failureFlash: true
  }));

  router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
  });

  router.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const newUser = {
        id: uuidv4(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        conversations: []
      };
      const createdUser = await users.insert(newUser);
      console.log(createdUser);
      res.redirect(authPath + '/login');
    } catch (error) {
      console.log(error);
      res.redirect(authPath + '/register');
    }
  });

  router.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
  });

  return router;
}