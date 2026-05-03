/**
 * Import Routes
 * Endpoints for CSV file imports
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CSVImporter } from '../../import/csvImporter.js';
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

  const userId = req.user?.id || 'default-user';

  try {
    // Read file content
    const fileContent = fs.readFileSync(file.path, 'utf-8');

    // Import transactions
    const importer = new CSVImporter();
    const result = await importer.importCSV(fileContent, userId, {
      dateFormat: req.body.dateFormat || 'YYYY-MM-DD',
      amountMultiplier: req.body.amountMultiplier ? parseFloat(req.body.amountMultiplier) : 1,
    });

    syncManager.enqueueTransactionSync();

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(207).json(result); // 207 Multi-Status: Some succeeded, some failed
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
  const template = `date,description,amount,type,category
2024-01-15,Salary,-2500,income,Salary
2024-01-16,Grocery Store,45.99,expense,Groceries
2024-01-17,Rent Payment,1200,expense,Rent`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transaction_template.csv"');
  res.send(template);
});

export default router;
