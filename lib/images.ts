import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

const imagesDir = new Directory(Paths.document, 'recipe-images');

function ensureImagesDir(): void {
  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true });
  }
}

export async function pickRecipeImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  ensureImagesDir();
  const source = new File(result.assets[0].uri);
  const dest = new File(imagesDir, `${Date.now()}-${Math.round(Math.random() * 1e6)}${source.extension ?? '.jpg'}`);
  await source.copy(dest);
  return dest.uri;
}

export function deleteRecipeImage(uri: string | null | undefined): void {
  if (!uri || !uri.startsWith(imagesDir.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best effort — a missing/locked file shouldn't block the caller
  }
}
