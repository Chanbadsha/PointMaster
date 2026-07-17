import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middlewares/auth.js';
import { requireRoomRole } from '../middlewares/authorize.js';
import { ROLES } from '../constants/index.js';
import { getMatchById } from '../services/match-service.js';
import { errorResponse } from '../utils/response.js';
import {
  getMatch,
  updateMatch,
  deleteMatch,
  startMatch,
  pauseMatch,
  resumeMatch,
  finishMatch,
} from '../controllers/match-controller.js';
import {
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
  validateTeams,
} from '../controllers/team-controller.js';
import {
  createRound,
  updateRound,
  undoRound,
  listRounds,
  getScores,
} from '../controllers/round-controller.js';

const router = Router();

router.use(authenticate);

async function resolveMatchRoom(req, res, next) {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return errorResponse(res, 'Invalid match ID', [], 400);
  }

  const match = await getMatchById(id);

  if (!match) {
    return errorResponse(res, 'Match not found', [], 404);
  }

  req.params.roomId = match.roomId.toString();
  next();
}

router.get('/:id', getMatch);
router.patch('/:id', resolveMatchRoom, requireRoomRole(ROLES.ADMIN), updateMatch);
router.delete('/:id', resolveMatchRoom, requireRoomRole(ROLES.ADMIN), deleteMatch);

router.patch('/:id/start', resolveMatchRoom, requireRoomRole(ROLES.ADMIN), startMatch);
router.patch('/:id/pause', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), pauseMatch);
router.patch('/:id/resume', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), resumeMatch);
router.patch('/:id/finish', resolveMatchRoom, requireRoomRole(ROLES.ADMIN), finishMatch);

router.get('/:id/teams', resolveMatchRoom, requireRoomRole(ROLES.PLAYER), listTeams);
router.post('/:id/teams', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), createTeam);
router.post('/:id/teams/validate', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), validateTeams);
router.patch('/:id/teams/:teamId', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), updateTeam);
router.delete('/:id/teams/:teamId', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), deleteTeam);

router.post('/:id/rounds', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), createRound);
router.patch('/:id/rounds/:roundId', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), updateRound);
router.delete('/:id/rounds/:roundId', resolveMatchRoom, requireRoomRole(ROLES.MODERATOR), undoRound);
router.get('/:id/rounds', resolveMatchRoom, requireRoomRole(ROLES.PLAYER), listRounds);
router.get('/:id/scores', resolveMatchRoom, requireRoomRole(ROLES.PLAYER), getScores);

export default router;
