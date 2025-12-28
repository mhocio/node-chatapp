const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';
process.env.CRYPTO_SECRET = process.env.CRYPTO_SECRET || 'test_crypto_secret';
process.env.MONGODB_USERS_URI =
  process.env.MONGODB_USERS_URI || 'mongodb://localhost:27017/chatapp_users_test';
process.env.MONGODB_USERS_CONVERSATIONS =
  process.env.MONGODB_USERS_CONVERSATIONS || 'mongodb://localhost:27017/chatapp_conversations_test';
process.env.MONGO_SESSIONS_URI =
  process.env.MONGO_SESSIONS_URI || 'mongodb://localhost:27017/chatapp_sessions_test';

const { startServer } = require('../index');
const { closeDatabases } = require('../db-config');

test('GET /auth redirects to /auth/login', async () => {
  const server = startServer();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/auth`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/auth/login');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await closeDatabases();
  }
});
