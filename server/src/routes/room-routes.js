import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  listRooms,
} from '../controllers/room-controller.js';
import {
  addMember,
  removeMember,
  listMembers,
  updateMemberRole,
  joinRoom,
  leaveRoom,
} from '../controllers/room-member-controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createRoom);
router.get('/', listRooms);

router.post('/join', joinRoom);

router.get('/:id', getRoom);
router.patch('/:id', updateRoom);
router.delete('/:id', deleteRoom);

router.get('/:roomId/members', listMembers);
router.post('/:roomId/members', addMember);
router.delete('/:roomId/members/me', leaveRoom);
router.delete('/:roomId/members/:playerId', removeMember);
router.patch('/:roomId/members/:playerId/role', updateMemberRole);

export default router;
