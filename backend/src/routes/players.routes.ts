import { Router } from 'express';

import {
  getPlayer,
  getPlayers,
  patchPlayer,
  patchPlayerStatus,
  postPlayer,
  removePlayer,
} from '../controllers/players.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const playersRouter = Router();

playersRouter.get('/players', getPlayers);
playersRouter.get('/players/:playerId', getPlayer);
playersRouter.post('/players', authenticate, requireAdmin, postPlayer);
playersRouter.patch('/players/:playerId', authenticate, requireAdmin, patchPlayer);
playersRouter.patch('/players/:playerId/status', authenticate, requireAdmin, patchPlayerStatus);
playersRouter.delete('/players/:playerId', authenticate, requireAdmin, removePlayer);
