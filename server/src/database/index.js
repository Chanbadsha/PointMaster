import { MongoClient } from 'mongodb';
import env from '../config/env.js';

const client = new MongoClient(env.mongodbUri);
let db = null;

export async function connectDatabase() {
  if (db) return db;

  await client.connect();
  db = client.db();
  console.log('MongoDB connected');
  return db;
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
