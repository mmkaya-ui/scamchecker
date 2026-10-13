import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger, requestLogger } from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import checkRouter from './routes/check.js';
import searchRouter from './routes/search.js';

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

// CORS - allow all origins so requests from any client are accepted
app.use(cors());

// Body parsing (limit size to prevent attacks)
app.use(express.json({ limit: '100kb' }));

// Logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API Routes (with rate limiting)
app.use('/api/check', apiLimiter, checkRouter);
app.use('/api/search', apiLimiter, searchRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

const gracefulShutdown = () => {
  logger.info('Shutting down...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forcing shutdown after 5s');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
