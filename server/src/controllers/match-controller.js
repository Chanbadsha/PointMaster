import { ObjectId } from 'mongodb';
import {
  createMatchSchema,
  updateMatchSchema,
} from '../validators/match-validator.js';
import * as matchService from '../services/match-service.js';
import { MATCH_STATUS } from '../constants/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function createMatch(req, res) {
  try {
    const { roomId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const match = await matchService.createMatch({
      ...parsed.data,
      roomId,
      createdBy: req.user.id,
    });

    return successResponse(res, { match }, 'Match created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create match', [error.message], 500);
  }
}

export async function listMatches(req, res) {
  try {
    const { roomId } = req.params;

    if (!ObjectId.isValid(roomId)) {
      return errorResponse(res, 'Invalid room ID', [], 400);
    }

    const matches = await matchService.getRoomMatches(roomId);

    return successResponse(res, { matches });
  } catch (error) {
    return errorResponse(res, 'Failed to list matches', [error.message], 500);
  }
}

export async function getMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const match = await matchService.getMatchById(id);

    if (!match) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    return successResponse(res, { match });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch match', [error.message], 500);
  }
}

export async function updateMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const existing = await matchService.getMatchById(id);

    if (!existing) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    if (existing.status !== MATCH_STATUS.PENDING) {
      return errorResponse(res, 'Only pending matches can be edited', [], 400);
    }

    const parsed = updateMatchSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const updated = await matchService.updateMatch(id, parsed.data);

    if (!updated) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    return successResponse(res, { match: updated }, 'Match updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update match', [error.message], 500);
  }
}

export async function deleteMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const existing = await matchService.getMatchById(id);

    if (!existing) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    const deleted = await matchService.deleteMatch(id);

    if (!deleted) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    return successResponse(res, null, 'Match deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete match', [error.message], 500);
  }
}

export async function startMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await matchService.transitionMatchStatus(id, 'live');

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { match: result.match }, 'Match started');
  } catch (error) {
    return errorResponse(res, 'Failed to start match', [error.message], 500);
  }
}

export async function pauseMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await matchService.transitionMatchStatus(id, 'paused');

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { match: result.match }, 'Match paused');
  } catch (error) {
    return errorResponse(res, 'Failed to pause match', [error.message], 500);
  }
}

export async function resumeMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await matchService.transitionMatchStatus(id, 'live');

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { match: result.match }, 'Match resumed');
  } catch (error) {
    return errorResponse(res, 'Failed to resume match', [error.message], 500);
  }
}

export async function finishMatch(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await matchService.transitionMatchStatus(id, 'finished');

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { match: result.match }, 'Match finished');
  } catch (error) {
    return errorResponse(res, 'Failed to finish match', [error.message], 500);
  }
}
