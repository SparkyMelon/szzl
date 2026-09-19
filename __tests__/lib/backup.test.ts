import { hasExistingData, importBackup, pickAndParseBackup, wipeAllData } from '../../lib/backup';
import type { BackupFile } from '../../lib/backup';
import * as recipeRepository from '../../repositories/recipeRepository';
import * as tagRepository from '../../repositories/tagRepository';
import * as categoryRepository from '../../repositories/categoryRepository';
import * as images from '../../lib/images';
import * as DocumentPicker from 'expo-document-picker';

jest.mock('../../repositories/recipeRepository');
jest.mock('../../repositories/tagRepository');
jest.mock('../../repositories/categoryRepository');
jest.mock('../../lib/images');
jest.mock('expo-document-picker');

const mockedRecipeRepo = recipeRepository as jest.Mocked<typeof recipeRepository>;
const mockedTagRepo = tagRepository as jest.Mocked<typeof tagRepository>;
const mockedCategoryRepo = categoryRepository as jest.Mocked<typeof categoryRepository>;
const mockedImages = images as jest.Mocked<typeof images>;
const mockedDocumentPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRecipeRepo.getAllRecipes.mockResolvedValue([]);
  mockedTagRepo.getAllTags.mockResolvedValue([]);
  mockedCategoryRepo.getAllCategories.mockResolvedValue([]);
});

describe('backup.hasExistingData', () => {
  it('is true when recipes already exist', async () => {
    mockedRecipeRepo.getAllRecipes.mockResolvedValue([{ id: 1 } as any]);

    expect(await hasExistingData()).toBe(true);
  });

  it('is true when a custom tag exists, even with no recipes', async () => {
    mockedTagRepo.getAllTags.mockResolvedValue([
      { id: 1, name: 'Homemade', isDefault: false },
    ]);

    expect(await hasExistingData()).toBe(true);
  });

  it('is false when there are no recipes and only default tags', async () => {
    mockedTagRepo.getAllTags.mockResolvedValue([
      { id: 1, name: 'Vegetarian', isDefault: true },
    ]);

    expect(await hasExistingData()).toBe(false);
  });
});

describe('backup.wipeAllData', () => {
  it('deletes every recipe and every non-default tag, leaving defaults alone', async () => {
    mockedRecipeRepo.getAllRecipes.mockResolvedValue([{ id: 1 } as any, { id: 2 } as any]);
    mockedTagRepo.getAllTags.mockResolvedValue([
      { id: 10, name: 'Vegetarian', isDefault: true },
      { id: 11, name: 'Homemade', isDefault: false },
    ]);

    await wipeAllData();

    expect(mockedRecipeRepo.deleteRecipe).toHaveBeenCalledWith(1);
    expect(mockedRecipeRepo.deleteRecipe).toHaveBeenCalledWith(2);
    expect(mockedTagRepo.deleteTag).toHaveBeenCalledWith(11);
    expect(mockedTagRepo.deleteTag).not.toHaveBeenCalledWith(10);
  });
});

describe('backup.pickAndParseBackup', () => {
  function mockPickedFile(contents: string): void {
    mockedDocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'content://backup.json' } as any],
    } as any);
    globalThis.fetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve(contents) }) as any;
  }

  it('returns null when the user cancels the picker', async () => {
    mockedDocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true } as any);

    expect(await pickAndParseBackup()).toBeNull();
  });

  it('returns the parsed backup when it has a valid shape', async () => {
    const backup: BackupFile = { version: 1, exportedAt: '2024-01-01T00:00:00.000Z', recipes: [] };
    mockPickedFile(JSON.stringify(backup));

    expect(await pickAndParseBackup()).toEqual(backup);
  });

  it('rejects a file with the wrong version', async () => {
    mockPickedFile(JSON.stringify({ version: 2, recipes: [] }));

    await expect(pickAndParseBackup()).rejects.toThrow('not a valid Sizzle backup');
  });

  it('rejects a file with no recipes array', async () => {
    mockPickedFile(JSON.stringify({ version: 1 }));

    await expect(pickAndParseBackup()).rejects.toThrow('not a valid Sizzle backup');
  });

  it('rejects unrelated JSON', async () => {
    mockPickedFile(JSON.stringify({ hello: 'world' }));

    await expect(pickAndParseBackup()).rejects.toThrow('not a valid Sizzle backup');
  });
});

describe('backup.importBackup', () => {
  const baseBackupRecipe = {
    title: 'Soup',
    description: null,
    effort: null,
    prepTime: null,
    cookTime: null,
    servings: null,
    rating: null,
    isFavourite: false,
    tags: [],
    categories: [],
    ingredients: [],
    steps: [],
    image: null,
  };

  function makeBackup(recipes: BackupFile['recipes']): BackupFile {
    return { version: 1, exportedAt: new Date().toISOString(), recipes };
  }

  it('creates a tag that does not already exist', async () => {
    mockedTagRepo.createTag.mockResolvedValue(99);
    mockedRecipeRepo.createRecipe.mockResolvedValue(1);

    await importBackup(makeBackup([{ ...baseBackupRecipe, tags: ['NewTag'] }]));

    expect(mockedTagRepo.createTag).toHaveBeenCalledWith('NewTag');
    expect(mockedRecipeRepo.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: [99] }),
    );
  });

  it('reuses an existing tag instead of creating a duplicate, matching case-insensitively', async () => {
    mockedTagRepo.getAllTags.mockResolvedValue([{ id: 5, name: 'Quick', isDefault: true }]);
    mockedRecipeRepo.createRecipe.mockResolvedValue(1);

    await importBackup(makeBackup([{ ...baseBackupRecipe, tags: ['quick'] }]));

    expect(mockedTagRepo.createTag).not.toHaveBeenCalled();
    expect(mockedRecipeRepo.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: [5] }),
    );
  });

  it('matches an existing category by name but never creates a new one', async () => {
    mockedCategoryRepo.getAllCategories.mockResolvedValue([
      { id: 3, name: 'Breakfast', isDefault: true },
    ]);
    mockedRecipeRepo.createRecipe.mockResolvedValue(1);

    await importBackup(
      makeBackup([{ ...baseBackupRecipe, categories: ['Breakfast', 'MadeUpCategory'] }]),
    );

    expect(mockedRecipeRepo.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: [3] }),
    );
  });

  it('restores an embedded image to a new local file', async () => {
    mockedImages.saveRecipeImageFromBase64.mockReturnValue('file:///restored.jpg');
    mockedRecipeRepo.createRecipe.mockResolvedValue(1);

    await importBackup(
      makeBackup([{ ...baseBackupRecipe, image: { base64: 'abc123', extension: '.jpg' } }]),
    );

    expect(mockedImages.saveRecipeImageFromBase64).toHaveBeenCalledWith('abc123', '.jpg');
    expect(mockedRecipeRepo.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ imageUri: 'file:///restored.jpg' }),
    );
  });

  it('marks the recipe as favourite after creating it, when the backup says so', async () => {
    mockedRecipeRepo.createRecipe.mockResolvedValue(42);

    await importBackup(makeBackup([{ ...baseBackupRecipe, isFavourite: true }]));

    expect(mockedRecipeRepo.toggleFavourite).toHaveBeenCalledWith(42);
  });

  it('does not toggle favourite when the backup recipe was not favourited', async () => {
    mockedRecipeRepo.createRecipe.mockResolvedValue(42);

    await importBackup(makeBackup([{ ...baseBackupRecipe, isFavourite: false }]));

    expect(mockedRecipeRepo.toggleFavourite).not.toHaveBeenCalled();
  });

  it('returns the count of imported recipes', async () => {
    mockedRecipeRepo.createRecipe.mockResolvedValue(1);

    const result = await importBackup(makeBackup([baseBackupRecipe, baseBackupRecipe]));

    expect(result.imported).toBe(2);
  });
});
