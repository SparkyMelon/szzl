import { getDB } from '../lib/database';
import type { Tag } from '../models';

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  return db.getAllAsync<Tag>(`SELECT * FROM tags ORDER BY name`);
}
