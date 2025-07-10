import express from 'express';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { runMigrations } from './db/knex.js';
import routes from './routes/index.js';
import cors from 'cors';

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();

app.use(cors({
    origin: 'https://case-supplier.projects.bbdgrad.com'
}));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

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
    };
};

startServer();
