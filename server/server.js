import express from 'express';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { runMigrations } from './db/knex.js';
import routes from './routes/index.js';
import startSchedulers from './cron/scheduler.js';
import cors from 'cors';

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();
app.use(express.json());
app.use(cors());

// routes
app.use('/api', routes);

// global error handler
app.use(errorHandler);

// server startup
const startServer = async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
    });

    startSchedulers();

  } catch (err) {
    logger.error('Migrations failed', { error: err });
    logger.error('Server startup failed — exiting.');
    process.exit(1);
  }
};

startServer();
