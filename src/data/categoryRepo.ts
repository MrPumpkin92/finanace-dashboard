/**
 * Category Repository
 * CRUD operations for categories
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../models/Category.js';
import { getDatabase } from './db.js';

export class CategoryRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  /**
   * Create a new category
   */
  public create(input: CreateCategoryInput): Category {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, type, description, color, icon, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.type,
      input.description || null,
      input.color || '#808080',
      input.icon || null,
      now,
      now
    );

    return this.getById(id) as Category;
  }

  /**
   * Get category by ID
   */
  public getById(id: string): Category | null {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?');
    return (stmt.get(id) as Category) || null;
  }

  /**
   * Get category by name
   */
  public getByName(name: string): Category | null {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE name = ?');
    return (stmt.get(name) as Category) || null;
  }

  /**
   * Get all categories
   */
  public getAll(isActive?: boolean): Category[] {
    let query = 'SELECT * FROM categories';
    if (isActive !== undefined) {
      query += ` WHERE isActive = ${isActive ? 1 : 0}`;
    }
    query += ' ORDER BY name ASC';

    const stmt = this.db.prepare(query);
    return stmt.all() as Category[];
  }

  /**
   * Get categories by type
   */
  public getByType(type: 'income' | 'expense' | 'transfer'): Category[] {
    const stmt = this.db.prepare(
      'SELECT * FROM categories WHERE type = ? AND isActive = 1 ORDER BY name ASC'
    );
    return stmt.all(type) as Category[];
  }

  /**
   * Update a category
   */
  public update(id: string, input: UpdateCategoryInput): Category {
    const category = this.getById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      values.push(input.type);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description || null);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color || null);
    }
    if (input.icon !== undefined) {
      updates.push('icon = ?');
      values.push(input.icon || null);
    }
    if (input.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(input.isActive ? 1 : 0);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);

    return this.getById(id) as Category;
  }

  /**
   * Delete a category
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
