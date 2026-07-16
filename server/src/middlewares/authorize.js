import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { errorResponse } from '../utils/response.js';
import { hasMinRole, roomHasPermission } from '../services/rbac-service.js';

function getRoomId(req) {
  return req.params.roomId || req.params.id;
}

export function requireRoomRole(minimumRole) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', [], 401);
      }

      const roomId = getRoomId(req);

      if (!roomId || !ObjectId.isValid(roomId)) {
        return errorResponse(res, 'Invalid room ID', [], 400);
      }

      const player = await getDb()
        .collection('players')
        .findOne({ linkedUserId: req.user.id });

      if (!player) {
        return errorResponse(res, 'Player profile not found', [], 404);
      }

      const member = await getDb()
        .collection('roomMembers')
        .findOne({
          roomId: new ObjectId(roomId),
          playerId: player._id,
        });

      if (!member) {
        return errorResponse(res, 'You are not a member of this room', [], 403);
      }

      if (!hasMinRole(member.role, minimumRole)) {
        return errorResponse(res, 'Insufficient permissions', [], 403);
      }

      req.roomMember = member;
      next();
    } catch (error) {
      return errorResponse(res, 'Authorization failed', [error.message], 500);
    }
  };
}

export function requireRoomPermission(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', [], 401);
      }

      const roomId = getRoomId(req);

      if (!roomId || !ObjectId.isValid(roomId)) {
        return errorResponse(res, 'Invalid room ID', [], 400);
      }

      const player = await getDb()
        .collection('players')
        .findOne({ linkedUserId: req.user.id });

      if (!player) {
        return errorResponse(res, 'Player profile not found', [], 404);
      }

      const member = await getDb()
        .collection('roomMembers')
        .findOne({
          roomId: new ObjectId(roomId),
          playerId: player._id,
        });

      if (!member) {
        return errorResponse(res, 'You are not a member of this room', [], 403);
      }

      const hasAny = permissions.some((permission) =>
        roomHasPermission(member.role, permission)
      );

      if (!hasAny) {
        return errorResponse(res, 'Insufficient permissions', [], 403);
      }

      req.roomMember = member;
      next();
    } catch (error) {
      return errorResponse(res, 'Authorization failed', [error.message], 500);
    }
  };
}
