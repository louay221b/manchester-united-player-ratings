import { Router } from 'express';

import {
  getActiveRankings,
  getAdminStatistics,
  getSeasonRankings,
} from '../controllers/rankings.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const rankingsRouter = Router();

rankingsRouter.get('/rankings/active', getActiveRankings);
rankingsRouter.get('/rankings/seasons/:seasonId', getSeasonRankings);
rankingsRouter.get(
  '/admin/statistics/seasons/:seasonId',
  authenticate,
  requireAdmin,
  getAdminStatistics,
);
