import { MongoClient } from 'mongodb';
import env from '../config/env.js';

const client = new MongoClient(env.mongodbUri);
let db = null;

export async function connectDatabase() {
  if (db) return db;

  await client.connect();
  db = client.db();
  console.log('MongoDB connected');

  await createIndexes(db);

  return db;
}

async function createIndexes(db) {
  await db.collection('roomMembers').createIndex(
    { roomId: 1, playerId: 1 },
    { unique: true, name: 'roomId_1_playerId_1' }
  );
  console.log('Database indexes created');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export function getClient() {
  return client;
}

export async function closeDatabase() {
  await client.close();
  db = null;
  console.log('MongoDB disconnected');
}
