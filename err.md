# Phase 7 — Bugs Found & Fixed

## Bug 1: `authorize.js` — ObjectId type mismatch in `linkedUserId` query

**File:** `server/src/middlewares/authorize.js:25,69`

**Symptom:** "Player profile not found" error when using `requireRoomRole()` or `requireRoomPermission()` middleware, even though the player's `linkedUserId` is correctly set in the database.

**Root cause:** MongoDB stores `linkedUserId` as an `ObjectId`, but the middleware queried it using `req.user.id` (a plain string). MongoDB `findOne({ linkedUserId: "string" })` does **not** match `linkedUserId: ObjectId("...")`.

**Fix:** Wrap `req.user.id` with `new ObjectId(req.user.id)` before querying.

**Severity:** High — blocked all room operations for authenticated users.

---

## Bug 2: `room-service.js` — Owner not added as room member on room creation

**File:** `server/src/services/room-service.js:30-49`

**Symptom:** "You are not a member of this room" (403) when the room owner tries to manage their own room (add members, create matches, etc.). The room owner was stored in `ownerId` but never added to the `roomMembers` collection.

**Root cause:** The `createRoom()` function only inserted the room document. It did not insert a corresponding `roomMembers` record for the owner with an `Admin` role.

**Fix:** After inserting the room, look up the player by `linkedUserId` and insert a `roomMembers` document with `role: 'Admin'`.

**Severity:** High — made the room completely unmanageable by the creator.

---

## Bug 3: `room-service.js` — Player not auto-created on signup

**File:** `server/src/services/room-service.js:49-62`

**Symptom:** "Player profile not found" (404) when trying to view a room detail page after creating a room as a freshly-signed-up user. The signup flow via Better Auth creates a `user` record, but no corresponding `players` document with `linkedUserId` is created.

**Root cause:** The `requireRoomRole(ROLES.PLAYER)` middleware on `GET /rooms/:id` looks up a player by `linkedUserId`. If the user never manually created a player and linked it, the lookup returns null, causing a 404 error. The frontend Create Room page navigates to the room detail after creation, which then fails.

**Fix:** In `createRoom()`, if no linked player exists for the owner, auto-create one using the user's name from the `user` collection. This ensures a fresh signup can immediately create and view rooms without an extra manual player-creation step.

**Severity:** High — blocked the main user flow (signup → create room → view room).
