import fs from 'fs';
import https from 'https';
import logger from '../utils/logger.js';

let agent = null;

const certPath = '/etc/ssl/casesupplier/mtls/case-supplier-client.crt';
const keyPath = '/etc/ssl/casesupplier/mtls/case-supplier-client.key';

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  agent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: false,
  });
  logger.info('[mTLS] HTTPS Agent configured using files on disk');
} else {
  logger.info('[mTLS] Certificates not found, using default agent');
}

export default agent;