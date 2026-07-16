import { ObjectId } from 'mongodb';
import {
  createTeamSchema,
  updateTeamSchema,
} from '../validators/team-validator.js';
import * as teamService from '../services/team-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function createTeam(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const parsed = createTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const result = await teamService.createTeam(id, parsed.data);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { team: result.team }, 'Team created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create team', [error.message], 500);
  }
}

export async function listTeams(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const teams = await teamService.getTeamsByMatch(id);

    return successResponse(res, { teams });
  } catch (error) {
    return errorResponse(res, 'Failed to list teams', [error.message], 500);
  }
}

export async function updateTeam(req, res) {
  try {
    const { teamId } = req.params;

    if (!ObjectId.isValid(teamId)) {
      return errorResponse(res, 'Invalid team ID', [], 400);
    }

    const parsed = updateTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    const result = await teamService.updateTeam(teamId, parsed.data);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    return successResponse(res, { team: result.team }, 'Team updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update team', [error.message], 500);
  }
}

export async function deleteTeam(req, res) {
  try {
    const { teamId } = req.params;

    if (!ObjectId.isValid(teamId)) {
      return errorResponse(res, 'Invalid team ID', [], 400);
    }

    const result = await teamService.deleteTeam(teamId);

    if (result.error) {
      return errorResponse(res, result.error, [], result.status);
    }

    if (!result.deleted) {
      return errorResponse(res, 'Team not found', [], 404);
    }

    return successResponse(res, null, 'Team deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete team', [error.message], 500);
  }
}

export async function validateTeams(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid match ID', [], 400);
    }

    const result = await teamService.validateTeams(id);

    return successResponse(res, result, result.valid ? 'Teams are valid' : 'Team validation failed');
  } catch (error) {
    return errorResponse(res, 'Failed to validate teams', [error.message], 500);
  }
}
