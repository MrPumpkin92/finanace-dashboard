/**
 * Categories Routes
 * REST API endpoints for category management
 */
import { Router, Request, Response } from 'express';
import { CategoryRepository } from '../../data/categoryRepo.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Category.js';
import { Logger } from '../../utils/logger.js';

const router = Router();
const categoryRepo = new CategoryRepository();

/**
 * GET /api/categories
 * Returns all categories with their color hex codes
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const isActive = req.query.active ? req.query.active === 'true' : true;
    const type = req.query.type as 'income' | 'expense' | 'transfer' | undefined;

    let categories = type
      ? categoryRepo.getByType(type)
      : categoryRepo.getAll(isActive);

    // Format response with required fields
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color || '#808080', // Default gray if no color specified
      icon: cat.icon,
      description: cat.description,
      isActive: cat.isActive,
    }));

    res.json(formattedCategories);
    Logger.info('Categories retrieved', { count: formattedCategories.length });
  } catch (error) {
    Logger.error('Error fetching categories', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch categories',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/categories
 * Create a custom category
 * Body: { name, type: "income"|"expense"|"transfer", description?, color?, icon? }
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const input = req.body as CreateCategoryInput;

    // Validate required fields
    if (!input.name || !input.type) {
      res.status(400).json({
        error: 'Missing required fields: name, type',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate type
    if (!['income', 'expense', 'transfer'].includes(input.type)) {
      res.status(400).json({
        error: 'Type must be "income", "expense", or "transfer"',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check if category name already exists
    const existing = categoryRepo.getByName(input.name);
    if (existing) {
      res.status(409).json({
        error: 'Category with this name already exists',
        code: 'CONFLICT',
      });
      return;
    }

    const category = categoryRepo.create(input);
    res.status(201).json({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color || '#808080',
      icon: category.icon,
      description: category.description,
      isActive: category.isActive,
    });
    Logger.info('Category created', { categoryId: category.id, name: category.name });
  } catch (error) {
    Logger.error('Error creating category', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to create category',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/categories/:id
 * Get a specific category
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const category = categoryRepo.getById(req.params.id);
    if (!category) {
      res.status(404).json({
        error: 'Category not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color || '#808080',
      icon: category.icon,
      description: category.description,
      isActive: category.isActive,
    });
  } catch (error) {
    Logger.error('Error fetching category', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch category',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const category = categoryRepo.getById(req.params.id);
    if (!category) {
      res.status(404).json({
        error: 'Category not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const input = req.body as UpdateCategoryInput;
    const updated = categoryRepo.update(req.params.id, input);
    res.json({
      id: updated.id,
      name: updated.name,
      type: updated.type,
      color: updated.color || '#808080',
      icon: updated.icon,
      description: updated.description,
      isActive: updated.isActive,
    });
    Logger.info('Category updated', { categoryId: req.params.id });
  } catch (error) {
    Logger.error('Error updating category', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to update category',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const category = categoryRepo.getById(req.params.id);
    if (!category) {
      res.status(404).json({
        error: 'Category not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    categoryRepo.delete(req.params.id);
    res.status(204).send();
    Logger.info('Category deleted', { categoryId: req.params.id });
  } catch (error) {
    Logger.error('Error deleting category', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to delete category',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
