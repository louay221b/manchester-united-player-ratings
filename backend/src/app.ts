import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { getRootStatus } from './controllers/health.controller.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', getRootStatus);
app.use('/api', apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
