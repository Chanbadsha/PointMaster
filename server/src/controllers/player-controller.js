import { ObjectId } from 'mongodb';
import {
  createPlayerSchema,
  updatePlayerSchema,
  searchPlayerSchema,
} from '../validators/player-validator.js';
import * as playerService from '../services/player-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function createPlayer(req, res) {
  try {
    const parsed = createPlayerSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const player = await playerService.createPlayer({
      ...parsed.data,
      createdBy: req.user.id,
    });

    return successResponse(res, { player }, 'Player created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create player', [error.message], 500);
  }
}

export async function getPlayer(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const player = await playerService.getPlayerById(id);

    if (!player) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    return successResponse(res, { player });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch player', [error.message], 500);
  }
}

export async function updatePlayer(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const existing = await playerService.getPlayerById(id);

    if (!existing) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    const parsed = updatePlayerSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const updated = await playerService.updatePlayer(id, parsed.data);

    return successResponse(res, { player: updated }, 'Player updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update player', [error.message], 500);
  }
}

export async function deletePlayer(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const existing = await playerService.getPlayerById(id);

    if (!existing) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    await playerService.deletePlayer(id);

    return successResponse(res, null, 'Player deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete player', [error.message], 500);
  }
}

export async function searchPlayers(req, res) {
  try {
    const parsed = searchPlayerSchema.safeParse(req.query);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const players = await playerService.searchPlayers(parsed.data.q);

    return successResponse(res, { players });
  } catch (error) {
    return errorResponse(res, 'Failed to search players', [error.message], 500);
  }
}

export async function listPlayers(req, res) {
  try {
    const players = await playerService.getAllPlayers();

    return successResponse(res, { players });
  } catch (error) {
    return errorResponse(res, 'Failed to list players', [error.message], 500);
  }
}

export async function linkPlayer(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const player = await playerService.getPlayerById(id);

    if (!player) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    if (player.linkedUserId) {
      return errorResponse(res, 'Player is already linked to a user', [], 409);
    }

    const updated = await playerService.linkUserToPlayer(id, req.user.id);

    return successResponse(res, { player: updated }, 'Player linked to account');
  } catch (error) {
    return errorResponse(res, 'Failed to link player', [error.message], 500);
  }
}

export async function unlinkPlayer(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid player ID', [], 400);
    }

    const player = await playerService.getPlayerById(id);

    if (!player) {
      return errorResponse(res, 'Player not found', [], 404);
    }

    if (!player.linkedUserId || player.linkedUserId.toString() !== req.user.id) {
      return errorResponse(res, 'Player is not linked to your account', [], 400);
    }

    const updated = await playerService.unlinkPlayer(id);

    return successResponse(res, { player: updated }, 'Player unlinked from account');
  } catch (error) {
    return errorResponse(res, 'Failed to unlink player', [error.message], 500);
  }
}
