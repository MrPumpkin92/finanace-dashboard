/**
 * Power BI Embed Routes
 * Endpoints for Power BI report embedding and management
 */
import { Router, Request, Response } from 'express';
import { powerBIClient } from '../../api/powerBIClient.js';

const router = Router();

/**
 * GET /api/embed/config
 * Get embed configuration for Power BI report
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = process.env.POWER_BI_REPORT_ID;
    if (!reportId) {
      res.status(400).json({ error: 'POWER_BI_REPORT_ID not configured' });
      return;
    }

    const embedConfig = await powerBIClient.getEmbedToken(reportId);
    res.json(embedConfig);
  } catch (error) {
    console.error('Error getting embed config:', error);
    res.status(500).json({ error: 'Failed to get embed configuration' });
  }
});

/**
 * POST /api/embed/refresh
 * Trigger dataset refresh
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.body as { datasetId: string };

    if (!datasetId) {
      res.status(400).json({ error: 'datasetId is required' });
      return;
    }

    const refreshId = await powerBIClient.refreshDataset(datasetId);
    res.json({ refreshId, status: 'initiated' });
  } catch (error) {
    console.error('Error triggering refresh:', error);
    res.status(500).json({ error: 'Failed to trigger dataset refresh' });
  }
});

/**
 * GET /api/embed/refresh-history/:datasetId
 * Get dataset refresh history
 */
router.get('/refresh-history/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string) : 10;

    const history = await powerBIClient.getRefreshHistory(datasetId, top);
    res.json(history);
  } catch (error) {
    console.error('Error fetching refresh history:', error);
    res.status(500).json({ error: 'Failed to fetch refresh history' });
  }
});

/**
 * GET /api/embed/pages/:reportId
 * Get report pages
 */
router.get('/pages/:reportId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;

    const pages = await powerBIClient.getReportPages(reportId);
    res.json(pages);
  } catch (error) {
    console.error('Error fetching report pages:', error);
    res.status(500).json({ error: 'Failed to fetch report pages' });
  }
});

export default router;
