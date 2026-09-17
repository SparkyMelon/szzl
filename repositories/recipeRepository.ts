import type { SQLiteDatabase } from 'expo-sqlite';
import { getDB } from '../lib/database';
import type { Category, Recipe, RecipeIngredient, RecipeStep, Tag } from '../models';
import type { SortOption } from '../models';

const RECIPE_COLUMNS = `
  id, title, description, effort, servings,
  prep_time   AS prepTime,
  cook_time   AS cookTime,
  image_uri   AS imageUri,
  is_favourite AS isFavourite,
  rating,
  created_at  AS createdAt,
  updated_at  AS updatedAt
`;

function sortClause(sort: SortOption): string {
  switch (sort) {
    case 'date_desc':   return 'ORDER BY r.created_at DESC, r.id DESC';
    case 'date_asc':    return 'ORDER BY r.created_at ASC, r.id ASC';
    case 'title_asc':   return 'ORDER BY r.title ASC';
    case 'title_desc':  return 'ORDER BY r.title DESC';
    case 'rating_desc': return 'ORDER BY CASE WHEN r.rating IS NULL THEN 1 ELSE 0 END, r.rating DESC';
    case 'rating_asc':  return 'ORDER BY CASE WHEN r.rating IS NULL THEN 1 ELSE 0 END, r.rating ASC';
  }
}

// ── Tag / category linking helpers ──────────────────────────────────
// Both tags and categories are joined to recipes through an identically
// shaped many-to-many table (recipe_id, <thing>_id), so the fetch and
// link/unlink logic is shared rather than duplicated per concept.

async function fetchLinked<T>(
  db: SQLiteDatabase,
  table: string,
  joinTable: string,
  joinColumn: string,
  recipeId: number,
): Promise<T[]> {
  return db.getAllAsync<T>(
    `SELECT x.* FROM ${table} x
     JOIN ${joinTable} j ON j.${joinColumn} = x.id
     WHERE j.recipe_id = ?`,
    [recipeId]
  );
}

async function attachTagsAndCategories(db: SQLiteDatabase, recipe: Recipe): Promise<Recipe> {
  const [tags, categories] = await Promise.all([
    fetchLinked<Tag>(db, 'tags', 'recipe_tags', 'tag_id', recipe.id),
    fetchLinked<Category>(db, 'categories', 'recipe_categories', 'category_id', recipe.id),
  ]);
  return { ...recipe, tags, categories };
}

async function relinkRecipe(
  db: SQLiteDatabase,
  joinTable: string,
  joinColumn: string,
  recipeId: number,
  ids: number[],
): Promise<void> {
  await db.runAsync(`DELETE FROM ${joinTable} WHERE recipe_id = ?`, [recipeId]);
  for (const id of ids) {
    await db.runAsync(
      `INSERT INTO ${joinTable} (recipe_id, ${joinColumn}) VALUES (?, ?)`,
      [recipeId, id]
    );
  }
}

export async function getAllRecipes(sort: SortOption = 'date_desc'): Promise<Recipe[]> {
  const db = await getDB();
  const recipes = await db.getAllAsync<Recipe>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r ${sortClause(sort)}`
  );
  return Promise.all(recipes.map(recipe => attachTagsAndCategories(db, recipe)));
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const db = await getDB();
  const recipe = await db.getFirstAsync<Recipe>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r WHERE r.id = ?`, [id]
  );
  if (!recipe) return null;

  const ingredients = await db.getAllAsync<RecipeIngredient>(
    `SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order`, [id]
  );
  const steps = await db.getAllAsync<RecipeStep>(
    `SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order`, [id]
  );

  return attachTagsAndCategories(db, { ...recipe, ingredients, steps });
}

export async function searchRecipes(
  query: string,
  tagIds: number[],
  categoryIds: number[],
  sort: SortOption = 'date_desc',
  favouritesOnly: boolean = false,
): Promise<Recipe[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: Array<string | number | null> = [];

  if (query.trim()) {
    conditions.push(`r.title LIKE ?`);
    params.push(`%${query.trim()}%`);
  }

  if (favouritesOnly) {
    conditions.push(`r.is_favourite = 1`);
  }

  if (tagIds.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM recipe_tags rt
        WHERE rt.recipe_id = r.id
        AND rt.tag_id IN (${tagIds.map(() => '?').join(',')})
      )
    `);
    params.push(...tagIds);
  }

  if (categoryIds.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM recipe_categories rc
        WHERE rc.recipe_id = r.id
        AND rc.category_id IN (${categoryIds.map(() => '?').join(',')})
      )
    `);
    params.push(...categoryIds);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const recipes = await db.getAllAsync<Recipe>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r ${where} ${sortClause(sort)}`,
    params
  );

  return Promise.all(recipes.map(recipe => attachTagsAndCategories(db, recipe)));
}

export interface RecipeCreateInput {
  title: string;
  description: string | null;
  effort: 'easy' | 'medium' | 'hard' | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  rating: number | null;
  ingredients: Array<{ name: string; quantity: string; unit: string | null }>;
  steps: Array<{ instruction: string }>;
  tagIds: number[];
  categoryIds: number[];
}

export async function createRecipe(input: RecipeCreateInput): Promise<number> {
  const db = await getDB();

  const result = await db.runAsync(
    `INSERT INTO recipes (title, description, effort, prep_time, cook_time, servings, rating, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [input.title, input.description, input.effort, input.prepTime, input.cookTime, input.servings, input.rating]
  );

  const id = result.lastInsertRowId as number;

  for (let i = 0; i < input.ingredients.length; i++) {
    const ing = input.ingredients[i];
    await db.runAsync(
      `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [id, ing.name, ing.quantity, ing.unit, i]
    );
  }

  for (let i = 0; i < input.steps.length; i++) {
    await db.runAsync(
      `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
      [id, input.steps[i].instruction, i]
    );
  }

  await relinkRecipe(db, 'recipe_tags', 'tag_id', id, input.tagIds);
  await relinkRecipe(db, 'recipe_categories', 'category_id', id, input.categoryIds);

  return id;
}

export interface RecipeUpdateInput {
  title: string;
  description: string | null;
  effort: 'easy' | 'medium' | 'hard' | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  rating: number | null;
  ingredients: Array<{ name: string; quantity: string; unit: string | null }>;
  steps: Array<{ instruction: string }>;
  tagIds: number[];
  categoryIds: number[];
}

export async function updateRecipe(id: number, input: RecipeUpdateInput): Promise<void> {
  const db = await getDB();

  await db.runAsync(
    `UPDATE recipes
     SET title = ?, description = ?, effort = ?, prep_time = ?, cook_time = ?,
         servings = ?, rating = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [input.title, input.description, input.effort, input.prepTime, input.cookTime, input.servings, input.rating, id]
  );

  await db.runAsync(`DELETE FROM recipe_ingredients WHERE recipe_id = ?`, [id]);
  for (let i = 0; i < input.ingredients.length; i++) {
    const ing = input.ingredients[i];
    await db.runAsync(
      `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [id, ing.name, ing.quantity, ing.unit, i]
    );
  }

  await db.runAsync(`DELETE FROM recipe_steps WHERE recipe_id = ?`, [id]);
  for (let i = 0; i < input.steps.length; i++) {
    await db.runAsync(
      `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
      [id, input.steps[i].instruction, i]
    );
  }

  await relinkRecipe(db, 'recipe_tags', 'tag_id', id, input.tagIds);
  await relinkRecipe(db, 'recipe_categories', 'category_id', id, input.categoryIds);
}

export async function toggleFavourite(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE recipes SET is_favourite = CASE WHEN is_favourite = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function deleteRecipe(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM recipes WHERE id = ?`, [id]);
}
