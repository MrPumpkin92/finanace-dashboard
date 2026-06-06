/**
 * Import Routes
 * Endpoints for CSV file imports
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importCSV } from '../../import/csvImporter.js';
import { syncManager } from '../../sync/syncManager.js';

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/import/csv
 * Import transactions from CSV file
 */
router.post('/csv', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    // Import transactions using the keyword-categorizing importer.
    // Handles bank Debit/Credit and single Amount column layouts, normalizes
    // dates, auto-categorizes by merchant, and de-duplicates via import_hash.
    const result = importCSV(file.path, {});

    syncManager.enqueueTransactionSync();

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    const failed = result.errors.length;
    const payload = {
      success: failed === 0,
      imported: result.imported,
      skipped: result.skipped,
      failed,
      errors: result.errors,
    };

    if (failed === 0) {
      res.status(201).json(payload);
    } else {
      res.status(207).json(payload); // 207 Multi-Status: some rows failed
    }
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    console.error('Error importing CSV:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import CSV',
    });
  }
});

/**
 * GET /api/import/template
 * Get CSV template for import
 */
router.get('/template', (_req: Request, res: Response): void => {
  const template = `Date,Description,Debit,Credit
2026-01-15,ACME CORP PAYROLL,,2500.00
2026-01-16,Grocery Store,45.99,
2026-01-17,Rent Payment,1200.00,`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transaction_template.csv"');
  res.send(template);
});

export default router;
