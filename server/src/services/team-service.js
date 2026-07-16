import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { MATCH_STATUS, GAME_TYPES } from '../constants/index.js';

const COLLECTION = 'teams';

async function getMatchWithRoom(matchId) {
  const db = getDb();
  const match = await db.collection('matches').findOne({
    _id: new ObjectId(matchId),
    deletedAt: { $exists: false },
  });
  if (!match) return null;
  return match;
}

async function getRoomMemberIds(roomId) {
  const db = getDb();
  const members = await db.collection('roomMembers')
    .find({ roomId: new ObjectId(roomId) })
    .project({ playerId: 1 })
    .toArray();
  return members.map((m) => m.playerId.toString());
}

async function isNameTaken(matchId, name, excludeTeamId = null) {
  const db = getDb();
  const query = {
    matchId: new ObjectId(matchId),
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  };
  if (excludeTeamId) {
    query._id = { $ne: new ObjectId(excludeTeamId) };
  }
  const existing = await db.collection(COLLECTION).findOne(query);
  return !!existing;
}

export async function getTeamsByMatch(matchId) {
  const db = getDb();

  const pipeline = [
    { $match: { matchId: new ObjectId(matchId) } },
    {
      $lookup: {
        from: 'players',
        localField: 'playerIds',
        foreignField: '_id',
        as: 'players',
      },
    },
    {
      $project: {
        _id: 1,
        matchId: 1,
        name: 1,
        playerIds: 1,
        createdAt: 1,
        updatedAt: 1,
        players: {
          _id: 1,
          name: 1,
        },
      },
    },
    { $sort: { createdAt: 1 } },
  ];

  const teams = await db.collection(COLLECTION).aggregate(pipeline).toArray();
  return teams;
}

export async function getTeamById(teamId) {
  const db = getDb();
  const team = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(teamId),
  });
  return team;
}

export async function createTeam(matchId, data) {
  const db = getDb();

  const match = await getMatchWithRoom(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.PENDING && match.status !== MATCH_STATUS.PREPARING) {
    return { error: 'Teams can only be modified when match is pending or preparing', status: 400 };
  }

  const nameTaken = await isNameTaken(matchId, data.name);
  if (nameTaken) {
    return { error: 'Team name is already taken in this match', status: 400 };
  }

  const roomMemberIds = await getRoomMemberIds(match.roomId);

  for (const pid of data.playerIds) {
    if (!roomMemberIds.includes(pid)) {
      return { error: 'All team players must be members of the room', status: 400 };
    }
  }

  const existingTeams = await db.collection(COLLECTION).find({
    matchId: new ObjectId(matchId),
  }).toArray();

  const playerIdObjs = data.playerIds.map((id) => new ObjectId(id));
  const allAssigned = existingTeams.flatMap((t) =>
    t.playerIds.map((p) => p.toString())
  );

  for (const pid of data.playerIds) {
    if (allAssigned.includes(pid)) {
      return { error: 'A player cannot be assigned to multiple teams', status: 400 };
    }
  }

  const now = new Date();

  const team = {
    matchId: new ObjectId(matchId),
    name: data.name,
    playerIds: playerIdObjs,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(team);
  return { team: { ...team, _id: result.insertedId } };
}

export async function updateTeam(teamId, data) {
  const db = getDb();

  const team = await getTeamById(teamId);

  if (!team) {
    return { error: 'Team not found', status: 404 };
  }

  const match = await getMatchWithRoom(team.matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.PENDING && match.status !== MATCH_STATUS.PREPARING) {
    return { error: 'Teams can only be modified when match is pending or preparing', status: 400 };
  }

  const setFields = { updatedAt: new Date() };

  if (data.name !== undefined) {
    const nameTaken = await isNameTaken(team.matchId.toString(), data.name, teamId);
    if (nameTaken) {
      return { error: 'Team name is already taken in this match', status: 400 };
    }
    setFields.name = data.name;
  }

  if (data.playerIds !== undefined) {
    const roomMemberIds = await getRoomMemberIds(match.roomId);

    for (const pid of data.playerIds) {
      if (!roomMemberIds.includes(pid)) {
        return { error: 'All team players must be members of the room', status: 400 };
      }
    }

    const playerIdObjs = data.playerIds.map((id) => new ObjectId(id));

    const otherTeams = await db.collection(COLLECTION).find({
      matchId: team.matchId,
      _id: { $ne: new ObjectId(teamId) },
    }).toArray();

    const allOtherAssigned = otherTeams.flatMap((t) =>
      t.playerIds.map((p) => p.toString())
    );

    for (const pid of data.playerIds) {
      if (allOtherAssigned.includes(pid)) {
        return { error: 'A player cannot be assigned to multiple teams', status: 400 };
      }
    }

    setFields.playerIds = playerIdObjs;
  }

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(teamId) },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return { team: result };
}

export async function deleteTeam(teamId) {
  const db = getDb();

  const team = await getTeamById(teamId);

  if (!team) {
    return { error: 'Team not found', status: 404 };
  }

  const match = await getMatchWithRoom(team.matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.PENDING && match.status !== MATCH_STATUS.PREPARING) {
    return { error: 'Teams can only be modified when match is pending or preparing', status: 400 };
  }

  const result = await db.collection(COLLECTION).deleteOne({
    _id: new ObjectId(teamId),
  });

  return { deleted: result.deletedCount > 0 };
}

export async function validateTeams(matchId) {
  const db = getDb();

  const match = await getMatchWithRoom(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  const teams = await db.collection(COLLECTION).find({
    matchId: new ObjectId(matchId),
  }).toArray();

  const errors = [];
  const game = match.game;

  if (game === GAME_TYPES.TWENTY_NINE) {
    if (teams.length !== 2) {
      errors.push('Twenty-Nine requires exactly 2 teams');
      return { valid: false, errors };
    }

    for (const team of teams) {
      if (team.playerIds.length !== 2) {
        errors.push(`Team "${team.name}" must have exactly 2 players for Twenty-Nine`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }
  } else {
    if (teams.length < 2) {
      errors.push('At least 2 teams are required');
      return { valid: false, errors };
    }

    for (const team of teams) {
      if (team.playerIds.length === 0) {
        errors.push(`Team "${team.name}" has no players assigned`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }
  }

  const teamSizes = teams.map((t) => t.playerIds.length);

  if (new Set(teamSizes).size > 1) {
    errors.push('All teams must have the same number of players');
    return { valid: false, errors };
  }

  const allPlayerIds = teams.flatMap((t) =>
    t.playerIds.map((p) => p.toString())
  );
  const uniquePlayerIds = new Set(allPlayerIds);

  if (allPlayerIds.length !== uniquePlayerIds.size) {
    errors.push('A player cannot be assigned to multiple teams');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
