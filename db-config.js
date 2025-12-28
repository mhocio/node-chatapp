const monk =  require('monk');

const usersDb = monk(process.env.MONGODB_USERS_URI);
const users = usersDb.get('users');
const isTestEnv = process.env.NODE_ENV && String(process.env.NODE_ENV).toLowerCase() === 'test';
if (!isTestEnv) {
  users.createIndex({ name: 1 }, { unique: true });
  users.createIndex({ email: 1 }, { unique: true });
}

const conversationsDb = monk(process.env.MONGODB_USERS_CONVERSATIONS);
const conversations = conversationsDb.get('conversations');
if (!isTestEnv) {
  conversations.createIndex({ id: 1 }, { unique: true });
}

async function closeDatabases() {
  await Promise.all([usersDb.close(), conversationsDb.close()]);
}

module.exports = { users, conversations, closeDatabases };
