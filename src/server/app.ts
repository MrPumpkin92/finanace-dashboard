/**
 * Express Application
 * Main server setup and middleware configuration
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { initializeDatabase, closeDatabase } from '../data/db.js';
import { seedDatabase } from '../data/seed.js';
import { validateAuthConfig } from '../auth/auth.js';

import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import embedRouter from './routes/embed.js';
import importRouter from './routes/import.js';

/**
 * Extended Express Request with user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

/**
 * Create Express app
 */
export function createApp(): Express {
  const app = express();

  // Middleware: Security
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );

  // Middleware: Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Middleware: Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.info(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Middleware: Mock user authentication (replace with real auth in production)
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: req.headers['x-user-id'] as string || 'default-user',
      email: req.headers['x-user-email'] as string,
    };
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/embed', embedRouter);
  app.use('/api/import', importRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}

/**
 * Initialize and start server
 */
export async function startServer(): Promise<void> {
  try {
    // Validate environment configuration
    validateAuthConfig();

    // Initialize database
    initializeDatabase();

    // Seed default categories
    await seedDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, () => {
      console.info(`✓ Server started on http://localhost:${port}`);
      console.info(`✓ API documentation: http://localhost:${port}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.info('Shutting down gracefully...');
      closeDatabase();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.info('Shutting down gracefully...');
      closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}
