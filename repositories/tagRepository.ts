import { getDB } from '../lib/database';
import type { Tag } from '../models';

interface TagRow {
  id: number;
  name: string;
  is_default: number;
}

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<TagRow>(`SELECT * FROM tags ORDER BY name`);
  return rows.map(row => ({ id: row.id, name: row.name, isDefault: row.is_default === 1 }));
}

export async function createTag(name: string): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(`INSERT INTO tags (name) VALUES (?)`, [name]);
  return result.lastInsertRowId as number;
}

export async function updateTag(id: number, name: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`UPDATE tags SET name = ? WHERE id = ?`, [name, id]);
}

export async function deleteTag(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM tags WHERE id = ?`, [id]);
}
