import { Router } from 'express';

import {
  getSeason,
  getSeasons,
  patchSeason,
  postActivateSeason,
  postSeason,
  removeSeason,
} from '../controllers/seasons.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const seasonsRouter = Router();

seasonsRouter.get('/seasons', getSeasons);
seasonsRouter.get('/seasons/:seasonId', getSeason);
seasonsRouter.post('/seasons', authenticate, requireAdmin, postSeason);
seasonsRouter.patch('/seasons/:seasonId', authenticate, requireAdmin, patchSeason);
seasonsRouter.delete('/seasons/:seasonId', authenticate, requireAdmin, removeSeason);
seasonsRouter.post('/seasons/:seasonId/activate', authenticate, requireAdmin, postActivateSeason);
