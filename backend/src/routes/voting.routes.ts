import { Router } from 'express';

import {
  getVotingMatch,
  getVotingMatchBallot,
  getVotingMatches,
  putVotingMatchBallot,
} from '../controllers/voting.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

export const votingRouter = Router();

votingRouter.get('/voting/matches', authenticate, getVotingMatches);
votingRouter.get('/voting/matches/:matchId', authenticate, getVotingMatch);
votingRouter.get('/voting/matches/:matchId/ballot', authenticate, getVotingMatchBallot);
votingRouter.put('/voting/matches/:matchId/ballot', authenticate, putVotingMatchBallot);
