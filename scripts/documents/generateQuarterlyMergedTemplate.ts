import fs from 'node:fs/promises';
import path from 'node:path';

import { buildQuarterlyMergedTemplatePrototype } from '@/server/documents/quarterly/mergedTemplatePrototype';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'templates', 'quarterly');

async function main() {
  for (const variant of ['v9', 'v9-1'] as const) {
    const document = await buildQuarterlyMergedTemplatePrototype(variant);
    const outputPath = path.join(OUTPUT_DIR, document.filename);
    await fs.writeFile(outputPath, document.buffer);
    process.stdout.write(`${variant}: ${outputPath}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
