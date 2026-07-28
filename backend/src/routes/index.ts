import { Router } from 'express';

import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(adminRouter);
