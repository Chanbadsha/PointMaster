import { ObjectId } from 'mongodb';
import { createRoundSchema } from '../validators/round-validator.js';
import * as roundService from '../services/round-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function createRound(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const parsed = createRoundSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const result = await roundService.createRound(id, parsed.data);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
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
