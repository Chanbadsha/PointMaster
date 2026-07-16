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

export default router;
