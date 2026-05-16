import { getDB } from '../lib/database';
import type { Recipe, RecipeIngredient, RecipeStep, Tag } from '../models';

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDB();

  const recipes = await db.getAllAsync<Recipe>(
    `SELECT * FROM recipes ORDER BY created_at DESC`
  );

  return Promise.all(recipes.map(async (recipe) => {
    const tags = await db.getAllAsync<Tag>(
      `SELECT t.* FROM tags t
       JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`, [recipe.id]
    );
    return { ...recipe, tags };
  }));
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const db = await getDB();

  const recipe = await db.getFirstAsync<Recipe>(
    `SELECT * FROM recipes WHERE id = ?`, [id]
  );
  if (!recipe) return null;

  const ingredients = await db.getAllAsync<RecipeIngredient>(
    `SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order`, [id]
  );
  const steps = await db.getAllAsync<RecipeStep>(
    `SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order`, [id]
  );
  const tags = await db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN recipe_tags rt ON rt.tag_id = t.id
     WHERE rt.recipe_id = ?`, [id]
  );

  return { ...recipe, ingredients, steps, tags };
}

export async function searchRecipes(query: string, tagIds: number[]): Promise<Recipe[]> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.trim()) {
    conditions.push(`r.title LIKE ?`);
    params.push(`%${query.trim()}%`);
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

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const recipes = await db.getAllAsync<Recipe>(
    `SELECT r.* FROM recipes r ${where} ORDER BY r.created_at DESC`,
    params
  );

  return Promise.all(recipes.map(async (recipe) => {
    const tags = await db.getAllAsync<Tag>(
      `SELECT t.* FROM tags t
       JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`, [recipe.id]
    );
    return { ...recipe, tags };
  }));
}
