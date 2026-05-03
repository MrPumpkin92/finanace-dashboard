/**
 * Application Entry Point
 * Main index file that starts the application
 */
import { startServer } from './server/app.js';
import { Logger } from './utils/logger.js';

// Start the application
startServer().catch((error) => {
  Logger.error('Fatal application error', {
    errorType: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
