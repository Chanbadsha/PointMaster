import { ObjectId } from 'mongodb';
import {
  createRoomSchema,
  updateRoomSchema,
} from '../validators/room-validator.js';
import * as roomService from '../services/room-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function createRoom(req, res) {
  try {
    const parsed = createRoomSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const room = await roomService.createRoom({
      ...parsed.data,
      ownerId: req.user.id,
    });

    return successResponse(res, { room }, 'Room created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create room', [error.message], 500);
  }
}

export async function getRoom(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const room = await roomService.getRoomById(id);

    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    return successResponse(res, { room });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch room', [error.message], 500);
  }
}

export async function updateRoom(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const existing = await roomService.getRoomById(id);

    if (!existing) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const parsed = updateRoomSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const updated = await roomService.updateRoom(id, parsed.data);

    if (!updated) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    return successResponse(res, { room: updated }, 'Room updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update room', [error.message], 500);
  }
}

export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const existing = await roomService.getRoomById(id);

    if (!existing) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const deleted = await roomService.deleteRoom(id);

    if (!deleted) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    return successResponse(res, null, 'Room deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete room', [error.message], 500);
  }
}

export async function listRooms(req, res) {
  try {
    const rooms = await roomService.getAllRooms();

    return successResponse(res, { rooms });
  } catch (error) {
    return errorResponse(res, 'Failed to list rooms', [error.message], 500);
  }
}
