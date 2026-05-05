import fs from 'node:fs/promises';
import path from 'node:path';

import {
  buildQuarterlyMergedTemplatePrototype,
  buildQuarterlyMergedTemplatePrototypeBundle,
} from '@/server/documents/quarterly/mergedTemplatePrototype';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'templates', 'quarterly');

async function main() {
  const mixedDocument = await buildQuarterlyMergedTemplatePrototypeBundle(['v10', 'v10-1'], 'v10');
  const mixedOutputPath = path.join(OUTPUT_DIR, mixedDocument.filename);
  await fs.writeFile(mixedOutputPath, mixedDocument.buffer);
  process.stdout.write(`v10: ${mixedOutputPath}\n`);

  const accidentDocument = await buildQuarterlyMergedTemplatePrototype('v10-1');
  const accidentOutputPath = path.join(OUTPUT_DIR, accidentDocument.filename);
  await fs.writeFile(accidentOutputPath, accidentDocument.buffer);
  process.stdout.write(`v10-1: ${accidentOutputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
