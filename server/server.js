import express from 'express';
import { runMigrations } from './db/knex.js';
import { StatusCodes } from 'http-status-codes';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();
app.use(express.json());

// example route
app.get('/', (req, res) => {
  logger.info('Root route accessed');
  res.status(StatusCodes.OK).json({ message: 'Case Closed Inc.' });
});

// global error handler
app.use(errorHandler);

// server startup
const startServer = async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    logger.error('Migrations failed', { error: err });
    logger.error('Server startup failed — exiting.');
    process.exit(1);
  }
};

startServer();
