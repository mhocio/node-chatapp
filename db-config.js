const monk =  require('monk');

const usersDb = monk(process.env.MONGODB_USERS_URI);
const users = usersDb.get('users');
users.createIndex({ name: 1 }, { unique: true });
users.createIndex({ email: 1 }, { unique: true });

const conversationsDb = monk(process.env.MONGODB_USERS_CONVERSATIONS);
const conversations = conversationsDb.get('conversations');
conversations.createIndex({ id: 1 }, { unique: true });

module.exports = { users, conversations };