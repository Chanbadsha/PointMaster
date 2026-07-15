import { ObjectId } from 'mongodb';
import {
  addMemberSchema,
  updateMemberRoleSchema,
  joinRoomSchema,
} from '../validators/room-member-validator.js';
import * as roomService from '../services/room-service.js';
import * as playerService from '../services/player-service.js';
import * as roomMemberService from '../services/room-member-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function addMember(req, res) {
  try {
    const { roomId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const room = await roomService.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const { playerId } = parsed.data;

    if (!ObjectId.isValid(playerId)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const player = await playerService.getPlayerById(playerId);
    if (!player) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    const member = await roomMemberService.addMember(roomId, playerId);
    return successResponse(res, { member }, 'Member added', 201);
  } catch (error) {
    if (error.message === 'Player is already a member of this room') {
      return errorResponse(res, error.message, [], 409);
    }
    return errorResponse(res, 'Failed to add member', [error.message], 500);
  }
}

export async function removeMember(req, res) {
  try {
    const { roomId, playerId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    if (!ObjectId.isValid(playerId)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const room = await roomService.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const member = await roomMemberService.getMember(roomId, playerId);
    if (!member) {
      return errorResponse(res, 'Member not found', [], 404);
    }

    await roomMemberService.removeMember(roomId, playerId);
    return successResponse(res, null, 'Member removed');
  } catch (error) {
    return errorResponse(res, 'Failed to remove member', [error.message], 500);
  }
}

export async function listMembers(req, res) {
  try {
    const { roomId } = req.params;
    const { search } = req.query;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const room = await roomService.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const members = await roomMemberService.getMembers(roomId, search || '');
    return successResponse(res, { members });
  } catch (error) {
    return errorResponse(res, 'Failed to list members', [error.message], 500);
  }
}

export async function updateMemberRole(req, res) {
  try {
    const { roomId, playerId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    if (!ObjectId.isValid(playerId)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const room = await roomService.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const member = await roomMemberService.getMember(roomId, playerId);
    if (!member) {
      return errorResponse(res, 'Member not found', [], 404);
    }

    const parsed = updateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const updated = await roomMemberService.updateMemberRole(
      roomId,
      playerId,
      parsed.data.role
    );
    return successResponse(res, { member: updated }, 'Role updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update role', [error.message], 500);
  }
}

export async function joinRoom(req, res) {
  try {
    const parsed = joinRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const { roomCode } = parsed.data;

    const room = await roomService.getRoomByCode(roomCode);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const player = await playerService.getPlayerByUserId(req.user.id);
    if (!player) {
      return errorResponse(
        res,
        'Player profile not found. Create a player first.',
        [],
        404
      );
    }

    const member = await roomMemberService.addMember(
      room._id.toString(),
      player._id.toString()
    );
    return successResponse(res, { member, room }, 'Joined room', 201);
  } catch (error) {
    if (error.message === 'Player is already a member of this room') {
      return errorResponse(res, error.message, [], 409);
    }
    return errorResponse(res, 'Failed to join room', [error.message], 500);
  }
}

export async function leaveRoom(req, res) {
  try {
    const { roomId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const room = await roomService.getRoomById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const player = await playerService.getPlayerByUserId(req.user.id);
    if (!player) {
      return errorResponse(res, 'Player profile not found', [], 404);
    }

    const member = await roomMemberService.getMember(
      roomId,
      player._id.toString()
    );
    if (!member) {
      return errorResponse(res, 'You are not a member of this room', [], 404);
    }

    await roomMemberService.removeMember(roomId, player._id.toString());
    return successResponse(res, null, 'Left room');
  } catch (error) {
    return errorResponse(res, 'Failed to leave room', [error.message], 500);
  }
}
