import { searchRecipes } from './recipeRepository';
import { getDB } from '../lib/database';

jest.mock('../lib/database', () => ({
  getDB: jest.fn(),
}));

const mockGetAllAsync = jest.fn();
const mockDb = { getAllAsync: mockGetAllAsync } as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getDB as jest.Mock).mockResolvedValue(mockDb);
  mockGetAllAsync.mockResolvedValue([]);
});

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
});
