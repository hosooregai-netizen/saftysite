import fs from 'node:fs/promises';
import path from 'node:path';

import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  creditLedgerEntrySchema,
  exportReportInputSchema,
  generateDraftFromPhotosInputSchema,
  reportPayloadSchema,
} from '../src/schemas';

const outputDir = path.resolve(process.cwd(), 'generated');

const schemaMap = {
  'report-payload.schema.json': zodToJsonSchema(reportPayloadSchema, 'ReportPayload'),
  'generate-draft-from-photos.schema.json': zodToJsonSchema(
    generateDraftFromPhotosInputSchema,
    'GenerateDraftFromPhotosInput',
  ),
  'export-report.schema.json': zodToJsonSchema(exportReportInputSchema, 'ExportReportInput'),
  'credit-ledger-entry.schema.json': zodToJsonSchema(creditLedgerEntrySchema, 'CreditLedgerEntry'),
};

await fs.mkdir(outputDir, { recursive: true });

for (const [filename, schema] of Object.entries(schemaMap)) {
  const targetPath = path.join(outputDir, filename);
  await fs.writeFile(targetPath, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');
}

console.log(`Generated ${Object.keys(schemaMap).length} JSON schemas in ${outputDir}`);
