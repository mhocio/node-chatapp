const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, users) {
  const authenticateUser = async (name, password, done) => {
		const user = await users.findOne({ name: name });
		if (user == null) {
			return done(null, false, { message: 'No user with that name' });
		}
		//console.log(user);
		//console.log(password);
		try {
			if (await bcrypt.compare(password, user.password)) {
				return done(null, user);
			} else {
				return done(null, false, { message: 'Password incorrect' });
			}
		} catch (e) {
				return done(e);
		}
  }

  passport.use(new LocalStrategy({ usernameField: 'name' }, authenticateUser));
  
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(function (id, done) {
      return users.findOne({ id: id }, function (error, user) {
          return done(error, user);
      });
    });
}

module.exports = initialize;