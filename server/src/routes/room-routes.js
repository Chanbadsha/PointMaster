import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  listRooms,
} from '../controllers/room-controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createRoom);
router.get('/', listRooms);
router.get('/:id', getRoom);
router.patch('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
