import { ObjectId } from 'mongodb';
import { createRoundSchema } from '../validators/round-validator.js';
import { updateRoundSchema, createCallBridgeRoundSchema, updateCallBridgeRoundSchema } from '../validators/score-validator.js';
import * as roundService from '../services/round-service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getMatchById } from '../services/match-service.js';
import { GAME_TYPES } from '../constants/index.js';
import { getIO } from '../sockets/index.js';

export async function createRound(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const match = await getMatchById(id);

    if (!match) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    let schema = createRoundSchema;
    if (match.game === GAME_TYPES.CALL_BRIDGE) {
      schema = createCallBridgeRoundSchema;
    }

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const result = await roundService.createRound(id, parsed.data);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    try {
      const io = getIO();
      io.to(`match:${id}`).emit('score:added', {
        matchId: id,
        round: result.round,
        matchComplete: result.matchComplete,
        matchWinner: result.matchWinner,
      });
    } catch {
      // Socket may not be initialized
    }

    return successResponse(res, {
      round: result.round,
      matchComplete: result.matchComplete,
      matchWinner: result.matchWinner,
    }, result.matchComplete ? 'Round recorded and match completed' : 'Round recorded', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to record round', [error.message], 500);
  }
}

export async function updateRound(req, res) {
  try {
    const { id, roundId } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    if (!ObjectId.isValid(roundId)) {
      return errorResponse(res, 'Invalid round ID', [], 400);
    }

    const match = await getMatchById(id);

    if (!match) {
      return errorResponse(res, 'Match not found', [], 404);
    }

    let schema = updateRoundSchema;
    if (match.game === GAME_TYPES.CALL_BRIDGE) {
      schema = updateCallBridgeRoundSchema;
    }

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const result = await roundService.updateRound(id, roundId, parsed.data, req.user?.id);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    try {
      const io = getIO();
      io.to(`match:${id}`).emit('score:updated', {
        matchId: id,
        roundId,
        round: result.round,
        matchComplete: result.matchComplete,
        matchWinner: result.matchWinner,
      });
    } catch {
      // Socket may not be initialized
    }

    return successResponse(res, {
      round: result.round,
      matchComplete: result.matchComplete,
      matchWinner: result.matchWinner,
    }, 'Round updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update round', [error.message], 500);
  }
}

export async function undoRound(req, res) {
  try {
    const { id, roundId } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    if (!ObjectId.isValid(roundId)) {
      return errorResponse(res, 'Invalid round ID', [], 400);
    }

    const result = await roundService.undoRound(id, roundId, req.user?.id);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    try {
      const io = getIO();
      io.to(`match:${id}`).emit('score:removed', {
        matchId: id,
        roundId,
        matchComplete: result.matchComplete,
        matchWinner: result.matchWinner,
      });
    } catch {
      // Socket may not be initialized
    }

    return successResponse(res, {
      undone: true,
      matchComplete: result.matchComplete,
      matchWinner: result.matchWinner,
    }, 'Round undone');
  } catch (error) {
    return errorResponse(res, 'Failed to undo round', [error.message], 500);
  }
}

export async function listRounds(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const rounds = await roundService.getMatchRounds(id);

    return successResponse(res, { rounds });
  } catch (error) {
    return errorResponse(res, 'Failed to list rounds', [error.message], 500);
  }
}

export async function getScores(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await roundService.getMatchScores(id);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, 'Failed to get scores', [error.message], 500);
  }
}
