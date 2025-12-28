# node-chatapp

Node.js chat application built with Express, EJS, Socket.IO, and MongoDB.

## How to run locally
- Create a `.env` file based on `.env.example`.
- Ensure your MongoDB URIs are reachable (Atlas or local).
- Run the app:

```sh
npm run dev
```

## Environment variables
- `CRYPTO_SECRET`: key for crypto operations.
- `SESSION_SECRET`: session signing secret.
- `MONGODB_USERS_URI`: MongoDB connection string for users DB.
- `MONGODB_USERS_CONVERSATIONS`: MongoDB connection string for conversations DB.
- `MONGO_SESSIONS_URI`: MongoDB connection string for session store.
- `PROTOCOL`: `HTTP` or `HTTPS` (used for URL generation).

## Scripts
- `npm start`: run the server with Node.
- `npm run dev`: run with nodemon for development.
- `npm test`: run the Node.js test runner.
- `npm run test:watch`: watch mode for tests.

## Testing
Tests use Node's built-in test runner and require MongoDB.
- Create a `.env.test` file based on `.env.test.example`.
- Ensure MongoDB is running locally.
- Run:

```sh
npm test
```

## TODO
- [ ] Add more HTTP route coverage (auth, conversations, error cases).
- [ ] Add socket.io integration tests (connect, join, message flow).
- [ ] Add test fixtures/seeds for users and conversations.
- [ ] Add CI coverage reporting and thresholds.
- [ ] Add linting (ESLint) with CI enforcement.

## Roadmap (ordered, detailed)
1. Test foundation:
   - add fixtures and seed helpers
   - add test DB reset/cleanup
   - document test env setup
2. Auth route tests:
   - register success
   - register duplicate email/name
   - login success
   - login invalid credentials
   - logout clears session
3. Conversation route tests:
   - list conversations (authenticated)
   - create conversation
   - add user to conversation
   - permission errors for non-owners
   - 404/invalid id cases
4. Socket tests:
   - connect + join room
   - send/receive message
   - disconnect cleanup
5. CI quality gates:
   - enable coverage reporting
   - set minimum coverage thresholds
6. Linting:
   - ESLint config + scripts
   - enforce in CI
7. Server cleanup:
   - split routes/controllers/services
   - add repository layer for DB access
8. Error handling:
   - standardize error shape
   - centralize error middleware
9. Rate limiting:
   - protect auth endpoints
   - protect message send endpoints
10. UI rewrite:
   - rebuild in React/Vue/Svelte
   - define state management + API layer
