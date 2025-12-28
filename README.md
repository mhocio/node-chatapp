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
