import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';

const COLLECTION = 'roomMembers';

export async function addMember(roomId, playerId) {
  const db = getDb();
  const now = new Date();

  const existing = await db.collection(COLLECTION).findOne({
    roomId: new ObjectId(roomId),
    playerId: new ObjectId(playerId),
  });

  if (existing) {
    throw new Error('Player is already a member of this room');
  }

  const member = {
    roomId: new ObjectId(roomId),
    playerId: new ObjectId(playerId),
    role: 'Player',
    joinedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(member);
  return { ...member, _id: result.insertedId };
}

export async function removeMember(roomId, playerId) {
  const db = getDb();

  const result = await db.collection(COLLECTION).deleteOne({
    roomId: new ObjectId(roomId),
    playerId: new ObjectId(playerId),
  });

  return result.deletedCount > 0;
}

export async function getMembers(roomId, search = '') {
  const db = getDb();

  const pipeline = [
    { $match: { roomId: new ObjectId(roomId) } },
    {
      $lookup: {
        from: 'players',
        localField: 'playerId',
        foreignField: '_id',
        as: 'player',
      },
    },
    { $unwind: { path: '$player', preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    pipeline.push({
      $match: {
        'player.name': { $regex: search, $options: 'i' },
      },
    });
  }

  pipeline.push({
    $project: {
      _id: 1,
      roomId: 1,
      playerId: 1,
      role: 1,
      joinedAt: 1,
      player: {
        _id: 1,
        name: 1,
        avatar: 1,
      },
    },
  });

  pipeline.push({ $sort: { joinedAt: 1 } });

  const members = await db.collection(COLLECTION).aggregate(pipeline).toArray();
  return members;
}

export async function getMember(roomId, playerId) {
  const db = getDb();
  const member = await db.collection(COLLECTION).findOne({
    roomId: new ObjectId(roomId),
    playerId: new ObjectId(playerId),
  });
  return member;
}

export async function updateMemberRole(roomId, playerId, role) {
  const db = getDb();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { roomId: new ObjectId(roomId), playerId: new ObjectId(playerId) },
    { $set: { role } },
    { returnDocument: 'after' }
  );

  return result;
}

export async function isMember(roomId, playerId) {
  const db = getDb();
  const count = await db.collection(COLLECTION).countDocuments({
    roomId: new ObjectId(roomId),
    playerId: new ObjectId(playerId),
  });
  return count > 0;
}

export async function getRoomsByPlayer(playerId) {
  const db = getDb();

  const memberships = await db
    .collection(COLLECTION)
    .find({ playerId: new ObjectId(playerId) })
    .toArray();

  const roomIds = memberships.map((m) => m.roomId);

  const rooms = await db
    .collection('rooms')
    .find({ _id: { $in: roomIds }, deletedAt: { $exists: false } })
    .toArray();

  return rooms;
}

export async function getMemberCount(roomId) {
  const db = getDb();
  return db.collection(COLLECTION).countDocuments({
    roomId: new ObjectId(roomId),
  });
}
