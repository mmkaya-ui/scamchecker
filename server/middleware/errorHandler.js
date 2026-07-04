import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log full error on server
  logger.error(err);

  // Default to 500
  let status = err.status || 500;
  let message = 'Internal Server Error';

  // Handle specific errors cleanly (don't leak stack traces to client)
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON payload';
  }

  res.status(status).json({
    error: message,
    status
  });
};
