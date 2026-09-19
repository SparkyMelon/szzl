import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { createRecipe, deleteRecipe, getAllRecipes, getRecipeById, toggleFavourite } from '../repositories/recipeRepository';
import { createTag, deleteTag, getAllTags } from '../repositories/tagRepository';
import { getAllCategories } from '../repositories/categoryRepository';
import { readRecipeImageAsBase64, saveRecipeImageFromBase64 } from './images';
import type { IngredientUnit } from '../models';

interface BackupImage {
  base64: string;
  extension: string;
}

interface BackupRecipe {
  title: string;
  description: string | null;
  effort: 'easy' | 'medium' | 'hard' | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  rating: number | null;
  isFavourite: boolean;
  tags: string[];
  categories: string[];
  ingredients: Array<{ name: string; quantity: string; unit: IngredientUnit | null }>;
  steps: Array<{ instruction: string }>;
  image: BackupImage | null;
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  recipes: BackupRecipe[];
}

export async function exportBackup(): Promise<'saved' | 'cancelled'> {
  const summaries = await getAllRecipes();
  const recipes: BackupRecipe[] = [];

  for (const summary of summaries) {
    const recipe = await getRecipeById(summary.id);
    if (!recipe) continue;

    recipes.push({
      title: recipe.title,
      description: recipe.description,
      effort: recipe.effort,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      rating: recipe.rating,
      isFavourite: recipe.isFavourite === 1,
      tags: (recipe.tags ?? []).map(t => t.name),
      categories: (recipe.categories ?? []).map(c => c.name),
      ingredients: (recipe.ingredients ?? []).map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
      steps: (recipe.steps ?? []).map(s => ({ instruction: s.instruction })),
      image: recipe.imageUri ? readRecipeImageAsBase64(recipe.imageUri) : null,
    });
  }

  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes,
  };

  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) return 'cancelled';

  const fileName = `sizzle-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    fileName,
    'application/json'
  );
  await StorageAccessFramework.writeAsStringAsync(fileUri, JSON.stringify(backup));
  return 'saved';
}

export interface RestoreResult {
  imported: number;
}

function isBackupFile(value: unknown): value is BackupFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as BackupFile).version === 1 &&
    Array.isArray((value as BackupFile).recipes)
  );
}

/**
 * Opens the document picker and parses the chosen file. Purely read-only — safe
 * to call before deciding whether any destructive step (wiping existing data) is
 * needed, since nothing here touches the database.
 */
export async function pickAndParseBackup(): Promise<BackupFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (picked.canceled || !picked.assets?.[0]) return null;

  // Documents picked from providers like Google Drive are content:// URIs that
  // may point at a cloud-only file expo-file-system's native READ checks can't
  // open directly (both the new File API and the legacy readAsStringAsync fail
  // on these). fetch() goes through a different native networking path that
  // Android handles correctly for content:// URIs, cloud-backed or not.
  const contents = await (await fetch(picked.assets[0].uri)).text();
  const parsed: unknown = JSON.parse(contents);
  if (!isBackupFile(parsed)) {
    throw new Error('This file is not a valid Sizzle backup.');
  }
  return parsed;
}

/** Whether the app has any recipes or user-created tags that a restore could collide with. */
export async function hasExistingData(): Promise<boolean> {
  const recipes = await getAllRecipes();
  if (recipes.length > 0) return true;
  const tags = await getAllTags();
  return tags.some(t => !t.isDefault);
}

/** Deletes every recipe (and its images) and every custom tag, leaving only the seeded defaults. */
export async function wipeAllData(): Promise<void> {
  const recipes = await getAllRecipes();
  for (const recipe of recipes) {
    await deleteRecipe(recipe.id);
  }
  const tags = await getAllTags();
  for (const tag of tags) {
    if (!tag.isDefault) {
      await deleteTag(tag.id);
    }
  }
}

export async function importBackup(backup: BackupFile): Promise<RestoreResult> {
  const tagIdByName = new Map((await getAllTags()).map(t => [t.name.toLowerCase(), t.id]));
  const categoryIdByName = new Map((await getAllCategories()).map(c => [c.name.toLowerCase(), c.id]));

  let imported = 0;

  for (const backupRecipe of backup.recipes) {
    const tagIds: number[] = [];
    for (const name of backupRecipe.tags) {
      const key = name.toLowerCase();
      let id = tagIdByName.get(key);
      if (id == null) {
        id = await createTag(name);
        tagIdByName.set(key, id);
      }
      tagIds.push(id);
    }

    // Meal-type categories are a fixed, curated list — match by name, don't create new ones.
    const categoryIds = backupRecipe.categories
      .map(name => categoryIdByName.get(name.toLowerCase()))
      .filter((id): id is number => id != null);

    const imageUri = backupRecipe.image
      ? saveRecipeImageFromBase64(backupRecipe.image.base64, backupRecipe.image.extension)
      : null;

    const id = await createRecipe({
      title: backupRecipe.title,
      description: backupRecipe.description,
      effort: backupRecipe.effort,
      prepTime: backupRecipe.prepTime,
      cookTime: backupRecipe.cookTime,
      servings: backupRecipe.servings,
      rating: backupRecipe.rating,
      imageUri,
      ingredients: backupRecipe.ingredients,
      steps: backupRecipe.steps,
      tagIds,
      categoryIds,
    });

    if (backupRecipe.isFavourite) {
      await toggleFavourite(id);
    }

    imported++;
  }

  return { imported };
}
