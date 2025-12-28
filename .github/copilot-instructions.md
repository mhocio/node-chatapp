## Quick context

This is a Node/Express chat application using server-rendered views and sockets.
Key files:
- `index.js` — app bootstrap, middleware, and server startup.
- `routes/` — Express routes.
- `controllers/` — request handlers and business logic.
- `views/` — EJS templates.
- `passport-config.js` — local auth strategy and session wiring.
- `db-config.js` — MongoDB/Monk configuration and connections.

Keep guidance concise and code-focused; cite these files when proposing changes.

## Big-picture architecture (what to know quickly)
- Express server with EJS views and Socket.IO for chat.
- Auth via Passport local strategy and session storage in MongoDB.
- Data access via `monk`; separate DBs for users, conversations, and sessions.

## Environment & run instructions (developer flows)
- Create a `.env` file based on `.env.example`.
- Dev server: `npm run dev` (nodemon).
- Production: `npm start`.

## Notes and gotchas
- Session and user DBs are configured via env vars in `db-config.js`.
- Keep Passport config consistent with session middleware ordering.
- Socket.IO uses the Express session; changes to session config impact sockets.
