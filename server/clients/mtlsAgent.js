import https from 'https';
import logger from '../utils/logger.js';

let agent = null;

if (process.env.MTLS_CERT && process.env.MTLS_KEY && process.env.MTLS_CA) {
  agent = new https.Agent({
    cert: process.env.MTLS_CERT,
    key: process.env.MTLS_KEY,
    ca: process.env.MTLS_CA,
    rejectUnauthorized: true,
  });
  logger.info('[mTLS] HTTPS Agent configured with certs from env');
} else {
  logger.info('[mTLS] No certs found, using default agent');
}

export default agent;
