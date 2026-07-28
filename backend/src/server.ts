import { env } from './config/env.js';
import { app } from './app.js';

const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`${signal} received. Closing HTTP server.`);

  server.close((error) => {
    if (error) {
      console.error('Error while closing HTTP server:', error);
      process.exit(1);
    }

    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
