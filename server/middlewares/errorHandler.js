import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {

  const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error(`${err.message} — ${req.method} ${req.originalUrl} — Status: ${status}`);

  res.status(status).json({ error: getReasonPhrase(status) });
};

export default errorHandler;
