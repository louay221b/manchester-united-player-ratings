import { Router } from 'express';

import {
  getLineup,
  getMatch,
  getMatches,
  patchMatch,
  postCloseVoting,
  postFinishMatch,
  postMatch,
  postPublishResults,
  postUnpublishResults,
  putLineup,
  removeMatch,
} from '../controllers/matches.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const matchesRouter = Router();

matchesRouter.get('/matches', getMatches);
matchesRouter.get('/matches/:matchId', getMatch);
matchesRouter.post('/matches', authenticate, requireAdmin, postMatch);
matchesRouter.patch('/matches/:matchId', authenticate, requireAdmin, patchMatch);
matchesRouter.delete('/matches/:matchId', authenticate, requireAdmin, removeMatch);
matchesRouter.get('/matches/:matchId/lineup', getLineup);
matchesRouter.put('/matches/:matchId/lineup', authenticate, requireAdmin, putLineup);
matchesRouter.post('/matches/:matchId/finish', authenticate, requireAdmin, postFinishMatch);
matchesRouter.post('/matches/:matchId/close-voting', authenticate, requireAdmin, postCloseVoting);
matchesRouter.post(
  '/matches/:matchId/publish-results',
  authenticate,
  requireAdmin,
  postPublishResults,
);
matchesRouter.post(
  '/matches/:matchId/unpublish-results',
  authenticate,
  requireAdmin,
  postUnpublishResults,
);
