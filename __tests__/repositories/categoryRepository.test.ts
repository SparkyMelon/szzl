import { getAllCategories } from '../../repositories/categoryRepository';
import { getDB } from '../../lib/database';

jest.mock('../../lib/database', () => ({
  getDB: jest.fn(),
}));

const mockGetAllAsync = jest.fn();
const mockDb = {
  getAllAsync: mockGetAllAsync,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getDB as jest.Mock).mockResolvedValue(mockDb);
  mockGetAllAsync.mockResolvedValue([]);
});

describe('categoryRepository.getAllCategories', () => {
  it('selects all categories ordered by id', async () => {
    await getAllCategories();

    expect(mockGetAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id'));
  });

  it('maps the is_default column to a real isDefault boolean', async () => {
    mockGetAllAsync.mockResolvedValue([
      { id: 1, name: 'Breakfast', is_default: 1 },
      { id: 2, name: 'Custom Meal', is_default: 0 },
    ]);

    const categories = await getAllCategories();

    expect(categories).toEqual([
      { id: 1, name: 'Breakfast', isDefault: true },
      { id: 2, name: 'Custom Meal', isDefault: false },
    ]);
  });
});
