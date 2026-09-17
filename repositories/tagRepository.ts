import { getDB } from '../lib/database';
import type { Tag } from '../models';

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  return db.getAllAsync<Tag>(`SELECT * FROM tags ORDER BY name`);
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
