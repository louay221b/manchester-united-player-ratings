import { Router } from 'express';

import { pingAdminApi } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireAdmin } from '../middleware/require-admin.middleware.js';

export const adminRouter = Router();

adminRouter.get('/admin/ping', authenticate, requireAdmin, pingAdminApi);
