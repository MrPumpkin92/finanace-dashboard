/**
 * Sync routes.
 */
import { Router, Request, Response } from 'express';

import { syncManager } from '../../sync/syncManager.js';
import { Logger } from '../../utils/logger.js';

const router = Router();

router.get('/status', (_req: Request, res: Response): void => {
  res.json(syncManager.getStatus());
});

router.post('/trigger', (_req: Request, res: Response): void => {
  try {
    syncManager.triggerFullSync();
    res.status(202).json({
      status: 'pending',
      message: 'Full sync started',
    });
  } catch (error) {
    Logger.error('Failed to trigger full sync', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to trigger sync',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;