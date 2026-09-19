import { getDB } from '../lib/database';
import type { Category } from '../models';

interface CategoryRow {
  id: number;
  name: string;
  is_default: number;
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<CategoryRow>(`SELECT * FROM categories ORDER BY id`);
  return rows.map(row => ({ id: row.id, name: row.name, isDefault: row.is_default === 1 }));
}