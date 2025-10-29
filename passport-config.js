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
  
		// Serialize the user: prefer explicit `id`. If the user document only has `_id`,
		// persist that value into the `id` field in the DB so the rest of the app can
		// always rely on req.session.passport.user being the `id` field.
		passport.serializeUser(async (user, done) => {
			try {
				if (user.id) {
					return done(null, user.id);
				}
				if (user._id) {
					const newId = String(user._id);
					// Persist the id field on the user document so future lookups by `id` succeed.
					try {
						await users.update({ _id: user._id }, { $set: { id: newId } });
					} catch (e) {
						// Non-fatal: continue and serialize the _id string
						console.warn('Failed to persist id field for user during serializeUser', e.message);
					}
					return done(null, newId);
				}
				return done(new Error('Cannot serialize user: no id or _id present'));
			} catch (err) {
				return done(err);
			}
		});

	// Deserialize: try to find by `id` field first, then by `_id` for compatibility
	passport.deserializeUser(async (id, done) => {
		try {
			let user = null;
			if (!id) return done(null, false);
			user = await users.findOne({ id: id });
			if (!user) {
				// attempt to find by _id (monk may accept string form)
				user = await users.findOne({ _id: id });
			}
			return done(null, user);
		} catch (error) {
			return done(error);
		}
	});
}

module.exports = initialize;