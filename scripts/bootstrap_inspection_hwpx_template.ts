/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const fs = require('node:fs/promises');
const path = require('node:path');

type TemplateSectionContract = {
  key: string;
  name: string;
  static: boolean;
  deferred: boolean;
  repeatBlockPath: string | null;
  textPlaceholders: string[];
  imagePlaceholders: string[];
  note?: string;
};

type TemplateImagePlaceholder = {
  table: number;
  row: number;
  col: number;
  placeholderPath: string;
  binaryItemId: string;
  repeatBlockPath?: string;
  deferred?: boolean;
  optional?: boolean;
};

type TemplateContract = {
  convention: {
    text: string;
    repeatStart: string;
    repeatEnd: string;
    checkboxText: string;
    image: string;
  };
  textPlaceholders: string[];
  repeatBlocks: string[];
  deferred: string[];
  textOnlyImageFallbackPlaceholders: string[];
  sections: TemplateSectionContract[];
  imagePlaceholders: TemplateImagePlaceholder[];
};

const DEFAULT_SOURCE_TEMPLATE_PATH = path.resolve(process.cwd(), '..', '기술지도 수동보고서 앱 - 서식_4.hwpx');
const DEFAULT_TEMPLATE_DIR = path.resolve(process.cwd(), 'public', 'templates', 'inspection');
const DEFAULT_TEMPLATE_OUT = path.join(DEFAULT_TEMPLATE_DIR, '기술지도 수동보고서 앱 - 서식_4.raw-annotated.hwpx');
const DEFAULT_CONTRACT_OUT = path.join(DEFAULT_TEMPLATE_DIR, '기술지도 수동보고서 앱 - 서식_4.template-contract.json');
const DEFAULT_GUIDE_OUT = path.join(DEFAULT_TEMPLATE_DIR, '기술지도 수동보고서 앱 - 서식_4.annotation-guide.md');
const DEFAULT_MAP_JSON_OUT = path.join(DEFAULT_TEMPLATE_DIR, '기술지도 수동보고서 앱 - 서식_4.annotation-map.json');
const DEFAULT_MAP_CSV_OUT = path.join(DEFAULT_TEMPLATE_DIR, '기술지도 수동보고서 앱 - 서식_4.annotation-map.csv');
const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover',
  sec1: '1. Site Overview',
  sec2: '2. Guidance Overview',
  sec3: '3. Site Photos',
  sec4: '4. Follow-up Results',
  sec5: '5. Summary',
  sec6: '6. Preventive Measures',
  sec7: '7. Findings and Improvements',
  sec8: '8. Process Risk Assessment',
  sec9: '9. TBM and Risk Check',
  sec10: '10. Measurements',
  sec11: '11. Education',
  sec12: '12. Activities',
  sec13: '13. Case Studies',
  sec14: '14. Safety Information',
};

function parseArgs(argv: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = 'true';
      continue;
    }

    result[key] = next;
    index += 1;
  }
  return result;
}

function csvCell(value: string | number | boolean | null | undefined) {
  const text = value == null ? '' : String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function repeatBlockMarkers(blockPath: string, convention: TemplateContract['convention']) {
  return {
    start: convention.repeatStart.replace('full.array.path', blockPath),
    end: convention.repeatEnd.replace('full.array.path', blockPath),
  };
}

function buildAnnotationMap(contract: TemplateContract) {
  const imageByPath = Object.fromEntries(
    contract.imagePlaceholders.map((item) => [item.placeholderPath, item]),
  ) as Record<string, TemplateImagePlaceholder>;

  return contract.sections.map((section) => ({
    key: section.key,
    name: SECTION_LABELS[section.key] ?? section.name,
    deferred: section.deferred,
    repeatBlockPath: section.repeatBlockPath,
    repeatMarkers: section.repeatBlockPath ? repeatBlockMarkers(section.repeatBlockPath, contract.convention) : null,
    note: section.note ?? '',
    textPlaceholders: section.textPlaceholders.map((placeholderPath) => ({
      kind: 'text',
      placeholderPath,
      repeatBlockPath: section.repeatBlockPath,
      note:
        contract.textOnlyImageFallbackPlaceholders.includes(placeholderPath)
          ? 'image source is written as text fallback in this template'
          : '',
    })),
    imagePlaceholders: section.imagePlaceholders.map((placeholderPath) => {
      const image = imageByPath[placeholderPath];
      return {
        kind: 'image',
        placeholderPath,
        repeatBlockPath: image?.repeatBlockPath ?? section.repeatBlockPath,
        table: image?.table ?? null,
        row: image?.row ?? null,
        col: image?.col ?? null,
        binaryItemId: image?.binaryItemId ?? '',
        deferred: Boolean(image?.deferred),
        optional: Boolean(image?.optional),
      };
    }),
  }));
}

function renderMarkdownGuide(options: {
  sourceTemplatePath: string;
  templateOutPath: string;
  contract: TemplateContract;
  annotationMap: ReturnType<typeof buildAnnotationMap>;
}) {
  const { sourceTemplatePath, templateOutPath, contract, annotationMap } = options;
  const lines: string[] = [];

  lines.push('# Inspection HWPX Annotation Guide');
  lines.push('');
  lines.push(`- Source template: \`${sourceTemplatePath}\``);
  lines.push(`- Working template: \`${templateOutPath}\``);
  lines.push(`- Generated at: \`${new Date().toISOString()}\``);
  lines.push('');
  lines.push('## Core Rules');
  lines.push('');
  lines.push(`- Text placeholder format: \`${contract.convention.text}\``);
  lines.push(`- Repeat start marker: \`${contract.convention.repeatStart}\``);
  lines.push(`- Repeat end marker: \`${contract.convention.repeatEnd}\``);
  lines.push(`- Checkbox text: \`${contract.convention.checkboxText}\``);
  lines.push(`- Image handling: ${contract.convention.image}`);
  lines.push('');
  lines.push('## Annotation Workflow');
  lines.push('');
  lines.push('- Keep the copied `.hwpx` as the manual working template and annotate only the visible prototype rows or cells.');
  lines.push('- For repeat sections, keep exactly one prototype block in the template, wrap that prototype with the start and end markers, and leave every placeholder indexed with `[0]`.');
  lines.push('- For image slots, preserve the original image frame and use the annotation map coordinates to identify the target cell instead of replacing the shape structure.');
  lines.push('- When a placeholder is listed as text-only image fallback, write the asset label or filename into text and do not create a new image shape.');
  lines.push('');
  lines.push('## Repeat Blocks');
  lines.push('');

  if (contract.repeatBlocks.length === 0) {
    lines.push('- None');
  } else {
    for (const repeatBlock of contract.repeatBlocks) {
      const markers = repeatBlockMarkers(repeatBlock, contract.convention);
      lines.push(`### ${repeatBlock}`);
      lines.push('');
      lines.push(`- Start marker: \`${markers.start}\``);
      lines.push(`- End marker: \`${markers.end}\``);
      lines.push('- Use only the `[0]` prototype placeholders inside this block. Runtime expansion rewrites them to `[1]`, `[2]`, and so on.');
      lines.push('');
    }
  }

  lines.push('## Sections');
  lines.push('');
  for (const section of annotationMap) {
    lines.push(`### ${section.key}`);
    lines.push('');
    lines.push(`- Repeat block: \`${section.repeatBlockPath ?? 'none'}\``);
    lines.push(`- Deferred: \`${section.deferred ? 'yes' : 'no'}\``);
    if (section.note) {
      lines.push(`- Note: ${section.note}`);
    }
    if (section.textPlaceholders.length) {
      lines.push('- Text placeholders:');
      for (const item of section.textPlaceholders) {
        const suffix = item.note ? ` (${item.note})` : '';
        lines.push(`  - \`${item.placeholderPath}\`${suffix}`);
      }
    }
    if (section.imagePlaceholders.length) {
      lines.push('- Image placeholders:');
      for (const item of section.imagePlaceholders) {
        const coordinates = [item.table, item.row, item.col].every((value) => typeof value === 'number')
          ? `table=${item.table}, row=${item.row}, col=${item.col}`
          : 'coordinate not mapped';
        const flags = [
          item.binaryItemId ? `binary=${item.binaryItemId}` : '',
          item.optional ? 'optional' : '',
          item.deferred ? 'deferred' : '',
        ]
          .filter(Boolean)
          .join(', ');
        lines.push(`  - \`${item.placeholderPath}\` (${coordinates}${flags ? `; ${flags}` : ''})`);
      }
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function renderAnnotationCsv(annotationMap: ReturnType<typeof buildAnnotationMap>) {
  const header = [
    'section_key',
    'section_name',
    'kind',
    'placeholder_path',
    'repeat_block_path',
    'table',
    'row',
    'col',
    'binary_item_id',
    'optional',
    'deferred',
    'note',
  ];
  const rows = [header.join(',')];

  for (const section of annotationMap) {
    for (const item of section.textPlaceholders) {
      rows.push(
        [
          section.key,
          section.name,
          'text',
          item.placeholderPath,
          item.repeatBlockPath ?? '',
          '',
          '',
          '',
          '',
          '',
          section.deferred,
          item.note,
        ]
          .map(csvCell)
          .join(','),
      );
    }

    for (const item of section.imagePlaceholders) {
      rows.push(
        [
          section.key,
          section.name,
          'image',
          item.placeholderPath,
          item.repeatBlockPath ?? '',
          item.table,
          item.row,
          item.col,
          item.binaryItemId,
          item.optional,
          item.deferred,
          section.note,
        ]
          .map(csvCell)
          .join(','),
      );
    }
  }

  return `${rows.join('\n')}\n`;
}

async function ensureDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeJson(filePath: string, value: unknown) {
  await ensureDirectory(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceTemplatePath = path.resolve(args.source ?? DEFAULT_SOURCE_TEMPLATE_PATH);
  const templateOutPath = path.resolve(args['template-out'] ?? DEFAULT_TEMPLATE_OUT);
  const contractOutPath = path.resolve(args['contract-out'] ?? DEFAULT_CONTRACT_OUT);
  const guideOutPath = path.resolve(args['guide-out'] ?? DEFAULT_GUIDE_OUT);
  const mapJsonOutPath = path.resolve(args['map-json-out'] ?? DEFAULT_MAP_JSON_OUT);
  const mapCsvOutPath = path.resolve(args['map-csv-out'] ?? DEFAULT_MAP_CSV_OUT);

  const templateModule = require(path.resolve(__dirname, 'generate_hwpx_report.ts')) as {
    TEMPLATE_CONTRACT: TemplateContract;
  };
  const contract = templateModule.TEMPLATE_CONTRACT;

  const sourceBuffer = await fs.readFile(sourceTemplatePath);
  await ensureDirectory(templateOutPath);
  await fs.writeFile(templateOutPath, sourceBuffer);

  const annotationMap = buildAnnotationMap(contract);
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceTemplatePath,
    templateOutPath,
    repeatBlocks: contract.repeatBlocks.map((blockPath) => ({
      path: blockPath,
      ...repeatBlockMarkers(blockPath, contract.convention),
    })),
    sections: annotationMap,
    textOnlyImageFallbackPlaceholders: contract.textOnlyImageFallbackPlaceholders,
  };

  await writeJson(contractOutPath, contract);
  await writeJson(mapJsonOutPath, manifest);
  await ensureDirectory(guideOutPath);
  await fs.writeFile(
    guideOutPath,
    renderMarkdownGuide({
      sourceTemplatePath,
      templateOutPath,
      contract,
      annotationMap,
    }),
    'utf8',
  );
  await ensureDirectory(mapCsvOutPath);
  await fs.writeFile(mapCsvOutPath, renderAnnotationCsv(annotationMap), 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        sourceTemplatePath,
        templateOutPath,
        contractOutPath,
        guideOutPath,
        mapJsonOutPath,
        mapCsvOutPath,
        repeatBlocks: contract.repeatBlocks,
      },
      null,
      2,
    )}\n`,
  );
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
