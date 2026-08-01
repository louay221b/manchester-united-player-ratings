import { Router } from 'express';

import {
  getFootballStatus,
  postInternalFootballSync,
  postSyncFootballFixture,
  postSyncFootballFixtures,
  postTestFootballConnection,
} from '../controllers/football.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { limitCronRequests, requireCronSecret } from '../middleware/cron-secret.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const footballRouter = Router();

footballRouter.get('/admin/football/integration', authenticate, requireAdmin, getFootballStatus);
footballRouter.post(
  '/admin/football/test-connection',
  authenticate,
  requireAdmin,
  postTestFootballConnection,
);
footballRouter.post(
  '/admin/football/sync/fixtures',
  authenticate,
  requireAdmin,
  postSyncFootballFixtures,
);
footballRouter.post(
  '/admin/football/sync/fixtures/:externalFixtureId',
  authenticate,
  requireAdmin,
  postSyncFootballFixture,
);
footballRouter.post(
  '/internal/football/sync',
  limitCronRequests,
  requireCronSecret,
  postInternalFootballSync,
);
