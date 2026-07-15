# PointMaster

Web app for managing offline card game scores (Twenty-Nine, Call Bridge).

## Phase workflow

- Implement exactly one phase at a time from `docs/19-Development-Phases.md`.
- Verify acceptance criteria before considering a phase complete.
- Build order per phase: backend first (Validator → Service → Controller → Route), then frontend.

## Hard constraints

- **JavaScript only** — never TypeScript.
- **No Mongoose** — use `mongodb` driver directly (`ObjectId`, manual timestamps, manual indexes).
- **No Axios** — use native `fetch()` everywhere.
- Layer flow: `Routes → Controllers → Services → Database`. No business logic in routes/controllers.
- Game engines (`game-engine/twenty-nine/`, `game-engine/call-bridge/`) must never import Express, MongoDB, Socket.IO, or frontend code.
- API envelope: `{ success, message, data }` / `{ success, message, errors }`.

## Conventions

| Thing | Convention |
|---|---|
| Components | PascalCase |
| Variables / functions | camelCase |
| Files / folders | kebab-case |
| Constants | UPPER_SNAKE_CASE |
| Imports order | Node → 3rd-party → internal libs → components → hooks → services → utils → constants → styles |
| Forms / validation | React Hook Form + Zod (both client and server) |
| UI | HeroUI + Tailwind |
| Data fetching | `fetch()` in Server Components; native `fetch()` in Client Components — never `useEffect` for data |
| Socket events | `resource:action` (e.g. `room:join`, `score:updated`) |

## Dev commands

| Action | Command |
|---|---|
| Start backend (dev) | `cd server && npm run dev` |
| Start frontend (dev) | `cd client && npm run dev` |
| Install deps | `cd client && npm install` / `cd server && npm install` |

## Project structure

```
pointmaster/
├── client/        # Next.js App Router
│   ├── src/app/        — routes (route groups: (auth), (public))
│   ├── src/components/ — reusable UI (common, forms, layout, ui/)
│   ├── src/features/   — feature modules (auth/, rooms/, matches/, ...)
│   ├── src/hooks/      — custom hooks
│   ├── src/providers/  — React Context providers
│   ├── src/lib/        — auth-client, fetch, socket
│   └── src/middleware.js
├── server/        # Express (ESM — "type": "module")
│   ├── src/app.js       — Express app factory
│   ├── src/server.js    — entrypoint (connects DB, init auth, init socket, listen)
│   ├── src/config/      — env, cors, better-auth
│   ├── src/database/    — MongoClient singleton
│   ├── src/routes/      — express.Router() only
│   ├── src/controllers/ — call services, return responses
│   ├── src/services/    — business logic
│   ├── src/middlewares/  — auth.js, error-handler.js, not-found.js
│   ├── src/validators/  — Zod schemas
│   ├── src/sockets/     — Socket.IO init
│   ├── src/game-engine/ — twenty-nine/, call-bridge/, shared/
│   ├── src/utils/       — response helpers
│   └── src/constants/   — ROLES, MATCH_STATUS, GAME_TYPES
├── docs/           # Spec files (gitignored — code may diverge)

```

## Auth specifics (Better Auth)

- **`betterAuth()` returns a Web API `Request`/`Response` handler** — not Express-compatible. Always wrap with `toNodeHandler` from `better-auth/node` before mounting on Express.
- **Auth handler is lazily mounted** in `server.js` after DB connection via `setAuthHandler()` pattern in `app.js`. This avoids import-order issues with `getDb()`.
- **MongoDB adapter** is at `better-auth/adapters/mongodb`. It's a bundled dependency of `better-auth`, not a separate package.
- **`trustedOrigins`** config must include `CLIENT_URL`, or Better Auth rejects cross-origin requests with "Invalid origin".
- **Client-side**: import is `createAuthClient` (not `createBetterAuthClient`). Base URL must include `/api/auth` suffix.
- **Sign-out** requires `Content-Type: application/json` — send `{}` as body.
- **Auth middleware** (`middlewares/auth.js`) uses `auth.api.getSession({ headers: req.headers })` to verify sessions. Attaches `req.user` and `req.session`.

## Environment

**Frontend** (`client/.env.local`):
```
NEXT_PUBLIC_APP_NAME=PointMaster
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_AUTH_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Backend** (`server/.env`):
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<user>:<pass>@<host>/pointmaster?...  # lowercase db name required
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=<min 32 chars>
COOKIE_SECRET=<min 32 chars>
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## Gotchas

- **`docs/` and `agents.md` (lowercase) are gitignored**. `AGENTS.md` (uppercase) is tracked. The entire `docs/` is excluded from version control — spec files exist locally but are not committed.
- **MongoDB URI database name is case-sensitive** on Atlas. The existing DB is lowercase `pointmaster`. Using `PointMaster` in URI causes "db already exists with different case" errors and Better Auth sign-up failures.
- **`README.md` exists but is empty**.
- **Better Auth creates its own collections** (`user`, `session`, `account`, `verification`) via the MongoDB adapter. The app also maintains a `users` collection for app-specific profile fields (`linkedPlayerId`).
- **Rate limiter** is at 100 req/15min on `/api`.
- **No ESLint config file exists** — `npm run lint` will fail until one is created.
