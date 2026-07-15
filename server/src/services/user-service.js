import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';

const COLLECTION = 'users';

export async function getUserById(userId) {
  const db = getDb();
  const user = await db.collection(COLLECTION).findOne({ _id: new ObjectId(userId) });
  return user;
}

export async function createUser(userId, userData) {
  const db = getDb();
  const now = new Date();

  const user = {
    _id: new ObjectId(userId),
    name: userData.name || '',
    email: userData.email || '',
    image: userData.image || null,
    linkedPlayerId: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTION).insertOne(user);
  return user;
}

export async function upsertUser(userId, userData) {
  const db = getDb();
  const existing = await getUserById(userId);

  if (existing) {
    return existing;
  }

  return createUser(userId, userData);
}

export async function updateUser(userId, updates) {
  const db = getDb();
  const now = new Date();

  const setFields = { ...updates, updatedAt: now };

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return result;
}
