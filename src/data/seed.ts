/**
 * Database Seed Script
 * Populates default categories on first run
 */
import { getDatabase, initializeDatabase } from './db.js';
import { CategoryRepository } from './categoryRepo.js';
import { DEFAULT_CATEGORIES } from '../models/Category.js';

async function seedDatabase(): Promise<void> {
  try {
    // Initialize database and run migrations
    initializeDatabase();

    const categoryRepo = new CategoryRepository();

    // Check if categories already exist
    const existingCategories = categoryRepo.getAll();
    if (existingCategories.length > 0) {
      console.info('✓ Categories already seeded, skipping...');
      return;
    }

    // Create default categories
    let createdCount = 0;
    for (const category of DEFAULT_CATEGORIES) {
      try {
        categoryRepo.create({
          name: category.name,
          type: category.type,
          description: category.description,
          color: category.color,
          icon: category.icon,
        });
        createdCount++;
      } catch (error) {
        // Skip if category already exists (race condition in concurrent environments)
        console.warn(`Warning: Could not create category ${category.name}:`, error);
      }
    }

    console.info(`✓ Database seeded successfully with ${createdCount} categories`);
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((error) => {
    console.error('Seed script error:', error);
    process.exit(1);
  });
}

export { seedDatabase };
