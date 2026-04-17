import fs from 'node:fs/promises';
import path from 'node:path';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function localImagePathToDataUrl(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).replace('.', '').toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    throw new Error(`Unsupported local image extension for data URL conversion: ${resolved}`);
  }
  const buffer = await fs.readFile(resolved);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
