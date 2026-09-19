import { runMigrations } from '../../lib/migrations';
import { getDB } from '../../lib/database';

jest.mock('../../lib/database', () => ({
  getDB: jest.fn(),
}));

const mockGetFirstAsync = jest.fn();
const mockExecAsync = jest.fn();
const mockWithTransactionAsync = jest.fn((fn: () => Promise<void>) => fn());
const mockDb = {
  getFirstAsync: mockGetFirstAsync,
  execAsync: mockExecAsync,
  withTransactionAsync: mockWithTransactionAsync,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getDB as jest.Mock).mockResolvedValue(mockDb);
  mockWithTransactionAsync.mockImplementation((fn: () => Promise<void>) => fn());
});

describe('migrations.runMigrations', () => {
  it('runs the initial migration and sets user_version on a fresh database', async () => {
    mockGetFirstAsync.mockResolvedValue({ user_version: 0 });

    await runMigrations();

    expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
    expect(mockExecAsync).toHaveBeenCalledWith('PRAGMA user_version = 1');
  });

  it('does nothing when the database is already at the latest version', async () => {
    mockGetFirstAsync.mockResolvedValue({ user_version: 1 });

    await runMigrations();

    expect(mockExecAsync).not.toHaveBeenCalled();
  });
});
