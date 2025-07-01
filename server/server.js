import express from 'express';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';

import { runMigrations } from './db/knex.js';
import { caseRouter } from './routers/caseRouter.js';
import deliveryRoutes from './routers/deliveryRoutes.js';
import simulationRoutes from './routers/simulationRoutes.js';

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();
app.use(express.json());

// TODO look at putting all these in a index.js and export then just use app.use('/api', routes);
// routes
app.use('/api/cases', caseRouter);
app.use('/api', deliveryRoutes)
app.use('/api', simulationRoutes);

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
