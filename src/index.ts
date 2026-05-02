/**
 * Application Entry Point
 * Main index file that starts the application
 */
import { startServer } from './server/app.js';

// Start the application
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
