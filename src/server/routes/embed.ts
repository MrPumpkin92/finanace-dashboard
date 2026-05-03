/**
 * Power BI Embed Routes
 * Endpoints for Power BI report embedding and management
 */
import { Router, Request, Response } from 'express';
import { powerBIClient } from '../../api/powerBIClient.js';
import { Logger } from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/embed/config
 * Get embed configuration for Power BI report
 */
router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
    const reportId = process.env.POWER_BI_REPORT_ID;
    if (!workspaceId || !reportId) {
      res.status(400).json({ error: 'POWER_BI_WORKSPACE_ID or POWER_BI_REPORT_ID not configured' });
      return;
    }

    const embedConfig = await powerBIClient.getEmbedToken(workspaceId, reportId);
    res.json(embedConfig);
  } catch (error) {
    Logger.error('Error getting embed config', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get embed configuration' });
  }
});

/**
 * POST /api/embed/refresh
 * Trigger dataset refresh
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
    const { datasetId } = req.body as { datasetId: string };

    if (!workspaceId || !datasetId) {
      res.status(400).json({ error: 'datasetId is required' });
      return;
    }

    await powerBIClient.refreshDataset(workspaceId, datasetId);
    res.json({ status: 'initiated' });
  } catch (error) {
    Logger.error('Error triggering refresh', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to trigger dataset refresh' });
  }
});

/**
 * GET /api/embed/refresh-history/:datasetId
 * Get dataset refresh history
 */
router.get('/refresh-history/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
    const { datasetId } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string) : 10;

    if (!workspaceId) {
      res.status(400).json({ error: 'POWER_BI_WORKSPACE_ID not configured' });
      return;
    }

    const history = await powerBIClient.getRefreshHistory(workspaceId, datasetId);
    res.json(history.slice(0, top));
  } catch (error) {
    Logger.error('Error fetching refresh history', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to fetch refresh history' });
  }
});

/**
 * GET /api/embed/pages/:reportId
 * Get report pages
 */
router.get('/pages/:reportId', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
    const { reportId } = req.params;

    if (!workspaceId) {
      res.status(400).json({ error: 'POWER_BI_WORKSPACE_ID not configured' });
      return;
    }

    const pages = await powerBIClient.getReportPages(workspaceId, reportId);
    res.json(pages);
  } catch (error) {
    Logger.error('Error fetching report pages', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to fetch report pages' });
  }
});

export default router;
