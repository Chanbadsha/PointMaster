import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';

const COLLECTION = 'rooms';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

async function generateUniqueRoomCode() {
  const db = getDb();
  let code;
  let exists = true;
  while (exists) {
    code = generateRoomCode();
    const existing = await db.collection(COLLECTION).findOne({ roomCode: code });
    if (!existing) {
      exists = false;
    }
  }
  return code;
}

export async function createRoom(data) {
  const db = getDb();
  const now = new Date();

  const roomCode = await generateUniqueRoomCode();

  const room = {
    name: data.name,
    description: data.description || null,
    ownerId: new ObjectId(data.ownerId),
    roomCode,
    isPublic: data.isPublic !== undefined ? data.isPublic : true,
    allowGuestView: data.allowGuestView !== undefined ? data.allowGuestView : true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(room);
  return { ...room, _id: result.insertedId };
}

export async function getRoomById(roomId) {
  const db = getDb();
  const room = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(roomId),
    deletedAt: { $exists: false },
  });
  return room;
}

export async function getRoomByCode(roomCode) {
  const db = getDb();
  const room = await db.collection(COLLECTION).findOne({
    roomCode,
    deletedAt: { $exists: false },
  });
  return room;
}

export async function getAllRooms() {
  const db = getDb();
  const rooms = await db
    .collection(COLLECTION)
    .find({ deletedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .toArray();
  return rooms;
}

export async function updateRoom(roomId, updates) {
  const db = getDb();
  const now = new Date();

  const setFields = { ...updates, updatedAt: now };

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(roomId), deletedAt: { $exists: false } },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deleteRoom(roomId) {
  const db = getDb();
  const now = new Date();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(roomId), deletedAt: { $exists: false } },
    { $set: { deletedAt: now, updatedAt: now } },
    { returnDocument: 'after' }
  );

  return result;
}
