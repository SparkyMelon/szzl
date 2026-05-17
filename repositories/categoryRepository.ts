import { getDB } from '../lib/database';
import type { Category } from '../models';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAllAsync<Category>(`SELECT * FROM categories ORDER BY id`);
}