import express from 'express';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { runMigrations } from './db/knex.js';
import routes from './routes/index.js';
import cors from 'cors';
import { allowCompany } from './middlewares/authMiddleware.js';

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || "localhost";

const app = express();

// app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use('/test', allowCompany(['screen-supplier-api.projects.bbdgrad.com']) , (req, res) => {
  const verified = req.headers['x-client-verify'];
  const subject = req.headers['x-client-subject'];
  const issuer = req.headers['x-client-issuer'];
  const fingerprint = req.headers['x-client-fingerprint'];
  const serial = req.headers['x-client-serial'];

  if (verified !== 'SUCCESS') {
    return res.status(401).json({ error: 'Client certificate not verified' });
  }

  res.json({ subject, issuer, fingerprint, serial });
});

app.use('/test2', allowCompany(['case-supplier-api.projects.bbdgrad.com', 'screen-supplier-api.projects.bbdgrad.com']) , (req, res) => {
  const verified = req.headers['x-client-verify'];
  const subject = req.headers['x-client-subject'];
  const issuer = req.headers['x-client-issuer'];
  const fingerprint = req.headers['x-client-fingerprint'];
  const serial = req.headers['x-client-serial'];

  if (verified !== 'SUCCESS') {
    return res.status(401).json({ error: 'Client certificate not verified' });
  }

  res.json({ subject, issuer, fingerprint, serial });
});

app.use('/test3', allowCompany(['case-supplier-api.projects.bbdgrad.com']) , (req, res) => {
  const verified = req.headers['x-client-verify'];
  const subject = req.headers['x-client-subject'];
  const issuer = req.headers['x-client-issuer'];
  const fingerprint = req.headers['x-client-fingerprint'];
  const serial = req.headers['x-client-serial'];

  if (verified !== 'SUCCESS') {
    return res.status(401).json({ error: 'Client certificate not verified' });
  }

  res.json({ subject, issuer, fingerprint, serial });
});

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
