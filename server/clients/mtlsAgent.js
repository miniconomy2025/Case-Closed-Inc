import fs from 'fs';
import https from 'https';
import logger from '../utils/logger.js';

let agent = null;

const certPath = '/etc/ssl/casesupplier/mtls/case-supplier-client.crt';
const keyPath = '/etc/ssl/casesupplier/mtls/case-supplier-client.key';
const caPath = '/etc/ssl/casesupplier/mtls/root-ca.crt';

if (fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(caPath)) {
  agent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true,
  });
  logger.info('[mTLS] HTTPS Agent configured using files on disk');
} else {
  logger.info('[mTLS] Certificates not found, using default agent');
}

export default agent;