import { Router } from 'express';
import { chat } from '../controllers/chatController';

const router = Router();

// Public chat endpoint (no auth required for now)
router.post('/', chat);

export default router;
