import { z } from 'zod';

export const createTransactionSchema = z.object({
  date: z.string().date('Invalid date format'),
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' }),
  }),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200),
  notes: z.string().max(500).optional(),
});

export type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense', 'transfer']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
