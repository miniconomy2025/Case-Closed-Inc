import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {

  const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  if (status === StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error(`Error: ${err.message}\nStack: ${err.stack}\n— ${req.method} ${req.originalUrl} — Status: ${status}`);
  } else {
    logger.warn(`${err.message} — ${req.method} ${req.originalUrl} — Status: ${status}`);
  }

  res.status(status).json({ error: getReasonPhrase(status) });
};

export default errorHandler;
