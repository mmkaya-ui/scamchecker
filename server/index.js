import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger, requestLogger } from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import checkRouter from './routes/check.js';
import searchRouter from './routes/search.js';
import { closeBrowser } from './scrapers/browser.js';

// Unhandled errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception:', err);
  process.exit(1);
});

const app = express();

// Security headers
app.use(helmet());

// CORS - restrict to local/prod
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173' }));

// Body parsing (limit size to prevent attacks)
app.use(express.json({ limit: '100kb' }));

// Logging
app.use(requestLogger);

// API Routes (with rate limiting)
app.use('/api/check', apiLimiter, checkRouter);
app.use('/api/search', apiLimiter, searchRouter);

// Global Error Handler
app.use(errorHandler);

// Handle graceful shutdown
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

const gracefulShutdown = async () => {
  logger.info('Shutting down...');
  try {
    await closeBrowser();
  } catch (err) {
    logger.error('Error closing browser during shutdown:', err);
  }
  
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  
  // Force kill after 10s if connections hang
  setTimeout(() => {
    logger.error('Forcing shutdown after 10s due to hanging connections');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
