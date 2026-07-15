import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';

const COLLECTION = 'players';

export async function createPlayer(data) {
  const db = getDb();
  const now = new Date();

  const player = {
    name: data.name,
    isGuest: data.isGuest || false,
    createdBy: data.createdBy ? new ObjectId(data.createdBy) : null,
    linkedUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(player);
  return { ...player, _id: result.insertedId };
}

export async function getPlayerById(playerId) {
  const db = getDb();
  const player = await db.collection(COLLECTION).findOne({ _id: new ObjectId(playerId) });
  return player;
}

export async function updatePlayer(playerId, updates) {
  const db = getDb();
  const now = new Date();

  const setFields = { ...updates, updatedAt: now };

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(playerId) },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deletePlayer(playerId) {
  const db = getDb();
  const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(playerId) });
  return result.deletedCount > 0;
}

export async function searchPlayers(query) {
  const db = getDb();
  const players = await db
    .collection(COLLECTION)
    .find({ name: { $regex: query, $options: 'i' } })
    .sort({ name: 1 })
    .toArray();
  return players;
}

export async function getAllPlayers() {
  const db = getDb();
  const players = await db
    .collection(COLLECTION)
    .find()
    .sort({ name: 1 })
    .toArray();
  return players;
}

export async function linkUserToPlayer(playerId, userId) {
  const db = getDb();
  const now = new Date();

  const player = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(playerId) },
    { $set: { linkedUserId: new ObjectId(userId), updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (player) {
    await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { linkedPlayerId: new ObjectId(playerId), updatedAt: now } }
    );
  }

  return player;
}

export async function unlinkPlayer(playerId) {
  const db = getDb();
  const now = new Date();

  const player = await db.collection(COLLECTION).findOne({ _id: new ObjectId(playerId) });
  if (!player) return null;

  if (player.linkedUserId) {
    await db.collection('users').findOneAndUpdate(
      { _id: player.linkedUserId },
      { $set: { linkedPlayerId: null, updatedAt: now } }
    );
  }

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(playerId) },
    { $set: { linkedUserId: null, updatedAt: now } },
    { returnDocument: 'after' }
  );

  return result;
}
