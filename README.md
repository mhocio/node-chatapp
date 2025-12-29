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

## V1 Roadmap (ordered)

### Stack
- Frontend: React + Vite + TypeScript
- State: Zustand + TanStack Query
- UI: shadcn/ui or Radix + Tailwind
- Backend: Express + Socket.IO
- Testing: Node test runner (API), Playwright or Vitest (web)
- CI: GitHub Actions

### Phase 0 - Foundation (tests + CI)
- Add fixtures and seed helpers.
- Add test DB reset/cleanup utility.
- Auth tests: register, login, logout, duplicates, invalid credentials.
- Conversation tests: create, list, add user, permissions, invalid IDs.
- Socket tests: connect, join, send/receive, disconnect cleanup.
- Add coverage reports and minimum thresholds.
- Add ESLint + formatting and enforce in CI.

### Phase 1 - Server cleanup
- Split routes/controllers/services for readability.
- Add repository layer for DB access.
- Standardize error shape and centralize error middleware.
- Add rate limiting for auth and message endpoints.

### Phase 2 - Web UI
- Create React app with Vite + TypeScript.
- Build auth screens (login/register).
- Build chat layout (sidebar + chat panel).
- Message list + composer with delivery state.
- Socket hooks and state management.
- Mobile-first responsive layout.

### Phase 3 - Product polish
- Profile settings and avatar upload.
- Password reset flow.
- Message edit/delete/reactions.
- Search conversation history.
- Basic analytics/logging and health check endpoint.
