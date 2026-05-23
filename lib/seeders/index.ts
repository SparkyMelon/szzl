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

async function insertRow(db: any, query: string, params: Array<string | number | null>): Promise<void> {
  await db.runAsync(query, params);
}

async function addRecipeTags(db: any, recipeId: number, tagNames: string[]): Promise<void> {
  await Promise.all(tagNames.map(async (tagName) => {
    const tagId = await getTagId(tagName);
    if (tagId) {
      await insertRow(
        db,
        `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
        [recipeId, tagId]
      );
    }
  }));
}

async function addRecipeCategories(db: any, recipeId: number, categoryNames: string[]): Promise<void> {
  await Promise.all(categoryNames.map(async (categoryName) => {
    const categoryId = await getCategoryId(categoryName);
    if (categoryId) {
      await insertRow(
        db,
        `INSERT OR IGNORE INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)`,
        [recipeId, categoryId]
      );
    }
  }));
}

type SeedIngredient = {
  name: string;
  quantity: string;
  unit: string | null;
  sortOrder: number;
};

type SeedStep = {
  instruction: string;
  sortOrder: number;
};

type SeedRecipe = {
  title: string;
  description: string;
  effort: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  rating?: number | null;
  isFavourite?: number;
  ingredients: SeedIngredient[];
  steps: SeedStep[];
  tagNames?: string[];
  categoryNames?: string[];
};

async function seedRecipe(db: any, recipe: SeedRecipe): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO recipes (title, description, effort, prep_time, cook_time, servings, rating, is_favourite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipe.title,
      recipe.description,
      recipe.effort,
      recipe.prepTime,
      recipe.cookTime,
      recipe.servings,
      recipe.rating ?? null,
      recipe.isFavourite ?? 0,
    ]
  );

  const recipeId = result.lastInsertRowId;

  await Promise.all(recipe.ingredients.map((ingredient) =>
    insertRow(
      db,
      `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [recipeId, ingredient.name, ingredient.quantity, ingredient.unit, ingredient.sortOrder]
    )
  ));

  await Promise.all(recipe.steps.map((step) =>
    insertRow(
      db,
      `INSERT INTO recipe_steps (recipe_id, instruction, sort_order) VALUES (?, ?, ?)`,
      [recipeId, step.instruction, step.sortOrder]
    )
  ));

  if (recipe.tagNames?.length) {
    await addRecipeTags(db, recipeId, recipe.tagNames);
  }

  if (recipe.categoryNames?.length) {
    await addRecipeCategories(db, recipeId, recipe.categoryNames);
  }

  return recipeId;
}

async function seed(): Promise<void> {
  const db = await getDB();

  await seedRecipe(db, {
    title: 'Scrambled Eggs',
    description: 'Simple and creamy scrambled eggs',
    effort: 'easy',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    rating: 4,
    isFavourite: 1,
    ingredients: [
      { name: 'Eggs', quantity: '4', unit: 'unit', sortOrder: 0 },
      { name: 'Butter', quantity: '1', unit: 'tbsp', sortOrder: 1 },
      { name: 'Salt', quantity: '1', unit: 'pinch', sortOrder: 2 },
    ],
    steps: [
      { instruction: 'Crack the eggs into a bowl and whisk together', sortOrder: 0 },
      { instruction: 'Melt butter in a pan over low heat', sortOrder: 1 },
      { instruction: 'Add eggs and stir slowly until just set', sortOrder: 2 },
    ],
    tagNames: ['Vegetarian'],
    categoryNames: ['Breakfast'],
  });

  await seedRecipe(db, {
    title: 'Chicken Stir Fry',
    description: 'Quick and healthy weeknight dinner',
    effort: 'medium',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    rating: 5,
    ingredients: [
      { name: 'Chicken breast', quantity: '2', unit: 'unit', sortOrder: 0 },
      { name: 'Soy sauce', quantity: '3', unit: 'tbsp', sortOrder: 1 },
      { name: 'Mixed vegetables', quantity: '300', unit: 'g', sortOrder: 2 },
      { name: 'Garlic', quantity: '2', unit: 'clove', sortOrder: 3 },
    ],
    steps: [
      { instruction: 'Slice chicken breast into thin strips', sortOrder: 0 },
      { instruction: 'Heat oil in a wok over high heat', sortOrder: 1 },
      { instruction: 'Fry chicken until golden, add garlic and vegetables', sortOrder: 2 },
      { instruction: 'Add soy sauce and toss everything together', sortOrder: 3 },
    ],
    tagNames: ['High Protein', 'Quick'],
    categoryNames: ['Dinner', 'Lunch'],
  });

  await seedRecipe(db, {
    title: 'Tomato Basil Pasta',
    description: 'Comforting pasta with fresh tomatoes and basil',
    effort: 'easy',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    rating: 3,
    ingredients: [
      { name: 'Pasta', quantity: '300', unit: 'g', sortOrder: 0 },
      { name: 'Tomatoes', quantity: '4', unit: 'unit', sortOrder: 1 },
      { name: 'Garlic', quantity: '2', unit: 'clove', sortOrder: 2 },
      { name: 'Fresh basil', quantity: 'handful', unit: 'handful', sortOrder: 3 },
      { name: 'Olive oil', quantity: '2', unit: 'tbsp', sortOrder: 4 },
    ],
    steps: [
      { instruction: 'Cook pasta according to package directions', sortOrder: 0 },
      { instruction: 'Sauté garlic in olive oil until fragrant', sortOrder: 1 },
      { instruction: 'Add chopped tomatoes and simmer for 8 minutes', sortOrder: 2 },
      { instruction: 'Toss pasta with sauce and fresh basil', sortOrder: 3 },
    ],
    tagNames: ['Vegetarian', 'Budget Friendly', 'Quick'],
    categoryNames: ['Lunch', 'Dinner'],
  });

  await seedRecipe(db, {
    title: 'Overnight Oats',
    description: 'Easy make-ahead breakfast with oats and fruit',
    effort: 'easy',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    ingredients: [
      { name: 'Rolled oats', quantity: '1', unit: 'cup', sortOrder: 0 },
      { name: 'Milk', quantity: '1', unit: 'cup', sortOrder: 1 },
      { name: 'Yogurt', quantity: '1/2', unit: 'cup', sortOrder: 2 },
      { name: 'Honey', quantity: '1', unit: 'tbsp', sortOrder: 3 },
      { name: 'Berries', quantity: '1/2', unit: 'cup', sortOrder: 4 },
    ],
    steps: [
      { instruction: 'Combine oats, milk, yogurt, and honey in a jar', sortOrder: 0 },
      { instruction: 'Stir gently until all ingredients are mixed', sortOrder: 1 },
      { instruction: 'Top with berries and refrigerate overnight', sortOrder: 2 },
      { instruction: 'Enjoy cold or warmed the next morning', sortOrder: 3 },
    ],
    tagNames: ['Vegetarian', 'Quick'],
    categoryNames: ['Breakfast'],
  });

  await seedRecipe(db, {
    title: 'Vegetable Curry',
    description: 'Rich coconut curry with mixed vegetables',
    effort: 'medium',
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    rating: 4,
    isFavourite: 1,
    ingredients: [
      { name: 'Mixed vegetables', quantity: '400', unit: 'g', sortOrder: 0 },
      { name: 'Coconut milk', quantity: '1', unit: 'cup', sortOrder: 1 },
      { name: 'Curry paste', quantity: '2', unit: 'tbsp', sortOrder: 2 },
      { name: 'Onion', quantity: '1', unit: 'unit', sortOrder: 3 },
      { name: 'Rice', quantity: '2', unit: 'cup', sortOrder: 4 },
    ],
    steps: [
      { instruction: 'Sauté onion until soft', sortOrder: 0 },
      { instruction: 'Add curry paste and cook for 1 minute', sortOrder: 1 },
      { instruction: 'Stir in vegetables and coconut milk', sortOrder: 2 },
      { instruction: 'Simmer until vegetables are tender', sortOrder: 3 },
      { instruction: 'Serve with steamed rice', sortOrder: 4 },
    ],
    tagNames: ['Vegan', 'Gluten Free', 'Spicy'],
    categoryNames: ['Dinner'],
  });

  await seedRecipe(db, {
    title: 'Chocolate Mug Cake',
    description: 'Fast single-serve dessert cooked in a mug',
    effort: 'easy',
    prepTime: 5,
    cookTime: 2,
    servings: 1,
    rating: 5,
    ingredients: [
      { name: 'Flour', quantity: '4', unit: 'tbsp', sortOrder: 0 },
      { name: 'Cocoa powder', quantity: '2', unit: 'tbsp', sortOrder: 1 },
      { name: 'Sugar', quantity: '2', unit: 'tbsp', sortOrder: 2 },
      { name: 'Milk', quantity: '3', unit: 'tbsp', sortOrder: 3 },
      { name: 'Butter', quantity: '1', unit: 'tbsp', sortOrder: 4 },
    ],
    steps: [
      { instruction: 'Mix dry ingredients in a microwave-safe mug', sortOrder: 0 },
      { instruction: 'Stir in milk and melted butter until smooth', sortOrder: 1 },
      { instruction: 'Microwave for 90-120 seconds until set', sortOrder: 2 },
      { instruction: 'Allow to cool briefly before serving', sortOrder: 3 },
    ],
    tagNames: ['Quick'],
    categoryNames: ['Dessert', 'Snack'],
  });
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