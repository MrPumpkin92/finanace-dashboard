/**
 * Categories Routes
 * CRUD endpoints for category management
 */
import { Router, Request, Response } from 'express';
import { CategoryRepository } from '../../data/categoryRepo.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Category.js';

const router = Router();
const categoryRepo = new CategoryRepository();

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const input = req.body as CreateCategoryInput;

    // Validate input
    if (!input.name || !input.type) {
      res.status(400).json({ error: 'Missing required fields: name, type' });
      return;
    }

    const category = categoryRepo.create(input);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * GET /api/categories
 * Get all categories
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const isActive = req.query.active ? req.query.active === 'true' : undefined;
    const type = req.query.type as 'income' | 'expense' | 'transfer' | undefined;

    let categories = type
      ? categoryRepo.getByType(type)
      : categoryRepo.getAll(isActive);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
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
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
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
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const input = req.body as UpdateCategoryInput;
    const updated = categoryRepo.update(req.params.id, input);
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
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
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    categoryRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
