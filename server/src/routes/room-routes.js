import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRoomRole } from '../middlewares/authorize.js';
import { ROLES } from '../constants/index.js';
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

router.get('/:id', requireRoomRole(ROLES.PLAYER), getRoom);
router.patch('/:id', requireRoomRole(ROLES.ADMIN), updateRoom);
router.delete('/:id', requireRoomRole(ROLES.ADMIN), deleteRoom);

router.get('/:roomId/members', requireRoomRole(ROLES.PLAYER), listMembers);
router.post('/:roomId/members', requireRoomRole(ROLES.MODERATOR), addMember);
router.delete('/:roomId/members/me', leaveRoom);
router.delete('/:roomId/members/:playerId', requireRoomRole(ROLES.ADMIN), removeMember);
router.patch('/:roomId/members/:playerId/role', requireRoomRole(ROLES.ADMIN), updateMemberRole);

export default router;
