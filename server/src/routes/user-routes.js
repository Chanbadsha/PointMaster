import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getProfile, updateProfile } from '../controllers/user-controller.js';

const router = Router();

router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, updateProfile);

export default router;
