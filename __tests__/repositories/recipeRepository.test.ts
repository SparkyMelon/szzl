import {
  createRecipe,
  deleteRecipe,
  searchRecipes,
  updateRecipe,
} from '../../repositories/recipeRepository';
import type { RecipeCreateInput, RecipeUpdateInput } from '../../repositories/recipeRepository';
import { getDB } from '../../lib/database';
import { deleteRecipeImage } from '../../lib/images';

jest.mock('../../lib/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../lib/images', () => ({
  deleteRecipeImage: jest.fn(),
}));

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockDb = {
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  runAsync: mockRunAsync,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getDB as jest.Mock).mockResolvedValue(mockDb);
  mockGetAllAsync.mockResolvedValue([]);
  mockGetFirstAsync.mockResolvedValue(null);
  mockRunAsync.mockResolvedValue({ lastInsertRowId: 1 });
});

const baseInput: RecipeCreateInput & RecipeUpdateInput = {
  title: 'Test Recipe',
  description: null,
  effort: null,
  prepTime: null,
  cookTime: null,
  servings: null,
  rating: null,
  imageUri: null,
  ingredients: [],
  steps: [],
  tagIds: [],
  categoryIds: [],
};

describe('recipeRepository.searchRecipes', () => {
  it('adds a title search condition when query text is provided', async () => {
    await searchRecipes('chili', [], [], 'date_desc');

    expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('r.title LIKE ?'),
      ['%chili%'],
    );
  });

  it('adds a tag filter for provided tag IDs', async () => {
    await searchRecipes('', [1, 2], [], 'date_desc');

    expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('recipe_tags rt'),
      [1, 2],
    );
  });

  it('adds a category filter for provided category IDs', async () => {
    await searchRecipes('', [], [5, 7], 'date_desc');

    expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('recipe_categories rc'),
      [5, 7],
    );
  });

  it('adds a favourites-only condition when requested', async () => {
    await searchRecipes('', [], [], 'date_desc', true);

    expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('r.is_favourite = 1'),
      [],
    );
  });
});

describe('recipeRepository.createRecipe', () => {
  it('inserts the recipe and returns its new id', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 42 });

    const id = await createRecipe({ ...baseInput, title: 'Pancakes' });

    expect(id).toBe(42);
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipes'),
      expect.arrayContaining(['Pancakes']),
    );
  });

  it('links the provided tags and categories to the new recipe', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 7 });

    await createRecipe({ ...baseInput, tagIds: [1, 2], categoryIds: [9] });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipe_tags'),
      [7, 1],
    );
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipe_tags'),
      [7, 2],
    );
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipe_categories'),
      [7, 9],
    );
  });

  it('inserts ingredients and steps in order', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 3 });

    await createRecipe({
      ...baseInput,
      ingredients: [{ name: 'Flour', quantity: '200', unit: 'g' }],
      steps: [{ instruction: 'Mix it' }],
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipe_ingredients'),
      [3, 'Flour', '200', 'g', 0],
    );
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO recipe_steps'),
      [3, 'Mix it', 0],
    );
  });
});

describe('recipeRepository.updateRecipe', () => {
  it('deletes the old image when it is replaced with a different one', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ imageUri: 'file:///old.jpg' });

    await updateRecipe(5, { ...baseInput, imageUri: 'file:///new.jpg' });

    expect(deleteRecipeImage).toHaveBeenCalledWith('file:///old.jpg');
  });

  it('does not delete the image when it is unchanged', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ imageUri: 'file:///same.jpg' });

    await updateRecipe(5, { ...baseInput, imageUri: 'file:///same.jpg' });

    expect(deleteRecipeImage).not.toHaveBeenCalled();
  });

  it('does not attempt to delete an image when there was none to begin with', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ imageUri: null });

    await updateRecipe(5, { ...baseInput, imageUri: 'file:///new.jpg' });

    expect(deleteRecipeImage).not.toHaveBeenCalled();
  });
});

describe('recipeRepository.deleteRecipe', () => {
  it('deletes the recipe row and its image when one is set', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ imageUri: 'file:///photo.jpg' });

    await deleteRecipe(11);

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM recipes'),
      [11],
    );
    expect(deleteRecipeImage).toHaveBeenCalledWith('file:///photo.jpg');
  });

  it('does not attempt to delete an image when the recipe had none', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ imageUri: null });

    await deleteRecipe(11);

    expect(deleteRecipeImage).not.toHaveBeenCalled();
  });
});
