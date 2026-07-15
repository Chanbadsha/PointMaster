import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createPlayer,
  getPlayer,
  updatePlayer,
  deletePlayer,
  searchPlayers,
  listPlayers,
  getMyPlayer,
  linkPlayer,
  unlinkPlayer,
} from '../controllers/player-controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createPlayer);
router.get('/', listPlayers);
router.get('/search', searchPlayers);
router.get('/me', getMyPlayer);
router.get('/:id', getPlayer);
router.patch('/:id', updatePlayer);
router.delete('/:id', deletePlayer);
router.post('/:id/link', linkPlayer);
router.post('/:id/unlink', unlinkPlayer);

export default router;
