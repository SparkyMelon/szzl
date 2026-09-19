import { createTag, deleteTag, getAllTags, updateTag } from '../../repositories/tagRepository';
import { getDB } from '../../lib/database';

jest.mock('../../lib/database', () => ({
  getDB: jest.fn(),
}));

const mockGetAllAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockDb = {
  getAllAsync: mockGetAllAsync,
  runAsync: mockRunAsync,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getDB as jest.Mock).mockResolvedValue(mockDb);
  mockGetAllAsync.mockResolvedValue([]);
  mockRunAsync.mockResolvedValue({ lastInsertRowId: 1 });
});

describe('tagRepository.getAllTags', () => {
  it('selects all tags ordered by name', async () => {
    await getAllTags();

    expect(mockGetAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY name'));
  });
});

describe('tagRepository.createTag', () => {
  it('inserts the tag and returns its new id', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 9 });

    const id = await createTag('Spicy');

    expect(id).toBe(9);
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tags'),
      ['Spicy'],
    );
  });
});

describe('tagRepository.updateTag', () => {
  it('updates the name for the given tag id', async () => {
    await updateTag(4, 'Renamed');

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tags'),
      ['Renamed', 4],
    );
  });
});

describe('tagRepository.deleteTag', () => {
  it('deletes the tag with the given id', async () => {
    await deleteTag(4);

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM tags'),
      [4],
    );
  });
});
