import { SQLiteDatabase } from 'expo-sqlite';
import { getDB } from '../database';
import m001 from './001_initial';

const migrations = [
  { version: 1, up: m001 },
];

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  return result?.user_version ?? 0;
}

export async function runMigrations(): Promise<void> {
  const db = await getDB();
  const currentVersion = await getCurrentVersion(db);
  const pending = migrations.filter(m => m.version > currentVersion);
  if (pending.length === 0) return;

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
