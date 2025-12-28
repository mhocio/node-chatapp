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
