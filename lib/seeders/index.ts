import { getDB } from '../database';
import { seedCategoriesSql, seedTagsSql } from '../migrations/001_initial';

async function getCategoryId(name: string): Promise<number | null> {
  const db = await getDB();
  const cat = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM categories WHERE name = ?`, [name]
  );
  return cat?.id ?? null;
}

async function getTagId(name: string): Promise<number | null> {
  const db = await getDB();
  const tag = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM tags WHERE name = ?`, [name]
  );
  return tag?.id ?? null;
}

async function seed(): Promise<void> {
  const db = await getDB();

  // Scrambled Eggs
  const eggs = await db.runAsync(
    `INSERT INTO recipes (title, description, effort, prep_time, cook_time, servings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Scrambled Eggs', 'Simple and creamy scrambled eggs', 'easy', 5, 10, 2]
  );
  const eggsId = eggs.lastInsertRowId;

  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [eggsId, 'Eggs', '4', 'unit', 0]
  );
  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [eggsId, 'Butter', '1', 'tbsp', 1]
  );
  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [eggsId, 'Salt', '1', 'pinch', 2]
  );

  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [eggsId, 'Crack the eggs into a bowl and whisk together', 0]
  );
  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [eggsId, 'Melt butter in a pan over low heat', 1]
  );
  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [eggsId, 'Add eggs and stir slowly until just set', 2]
  );

  const vegTagId = await getTagId('Vegetarian');
  if (vegTagId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`, [eggsId, vegTagId]
  );

  const breakfastCatId = await getCategoryId('Breakfast');
  if (breakfastCatId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)`, [eggsId, breakfastCatId]
  );

  // Chicken Stir Fry
  const stirFry = await db.runAsync(
    `INSERT INTO recipes (title, description, effort, prep_time, cook_time, servings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Chicken Stir Fry', 'Quick and healthy weeknight dinner', 'medium', 15, 15, 4]
  );
  const stirFryId = stirFry.lastInsertRowId;

  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [stirFryId, 'Chicken breast', '2', 'unit', 0]
  );
  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [stirFryId, 'Soy sauce', '3', 'tbsp', 1]
  );
  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [stirFryId, 'Mixed vegetables', '300', 'g', 2]
  );
  await db.runAsync(
    `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [stirFryId, 'Garlic', '2', 'clove', 3]
  );

  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [stirFryId, 'Slice chicken breast into thin strips', 0]
  );
  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [stirFryId, 'Heat oil in a wok over high heat', 1]
  );
  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [stirFryId, 'Fry chicken until golden, add garlic and vegetables', 2]
  );
  await db.runAsync(
    `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
    [stirFryId, 'Add soy sauce and toss everything together', 3]
  );

  const proteinTagId = await getTagId('High Protein');
  if (proteinTagId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`, [stirFryId, proteinTagId]
  );
  const quickTagId = await getTagId('Quick');
  if (quickTagId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`, [stirFryId, quickTagId]
  );

  const dinnerCatId = await getCategoryId('Dinner');
  if (dinnerCatId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)`, [stirFryId, dinnerCatId]
  );
  const lunchCatId = await getCategoryId('Lunch');
  if (lunchCatId) await db.runAsync(
    `INSERT OR IGNORE INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)`, [stirFryId, lunchCatId]
  );
}

export async function runSeeders(): Promise<void> {
  if (!__DEV__) return;

  const db = await getDB();
  const existing = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM recipes`
  );
  if (existing && existing.count > 0) {
    console.log('seeders: skipping, data already exists');
    return;
  }

  console.log('seeders: starting');
  await db.withTransactionAsync(seed);
  console.log('seeders: done');
}

export async function resetAndReseed(): Promise<void> {
  if (!__DEV__) throw new Error('Cannot reset in production');

  const db = await getDB();
  console.log('seeders: resetting');

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM recipe_categories;
      DELETE FROM recipe_tags;
      DELETE FROM recipe_steps;
      DELETE FROM recipe_ingredients;
      DELETE FROM recipes;
      DELETE FROM categories;
      DELETE FROM tags;
    `);
  });

  await db.execAsync(seedCategoriesSql);
  await db.execAsync(seedTagsSql);

  await db.withTransactionAsync(seed);
  console.log('seeders: reseeded');
}