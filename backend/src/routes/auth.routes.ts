import { Router } from 'express';

import { getCurrentApiUser, patchCurrentProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

export const authRouter = Router();

authRouter.get('/auth/me', authenticate, getCurrentApiUser);
authRouter.patch('/auth/profile', authenticate, patchCurrentProfile);
