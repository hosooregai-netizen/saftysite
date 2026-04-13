import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));

const targetLines = Number.parseInt(process.env.AIDLC_TARGET_LINES || '200', 10);
const hardLines = Number.parseInt(process.env.AIDLC_HARD_LINES || '300', 10);
const strict = args.has('--strict');

const scopes = {
  erp: [
    'app/sites',
    'components/worker',
    'features/home',
    'features/mailbox',
    'features/mobile',
    'features/site-reports',
    'tests/client',
    'skills/erp-platform-guardrails',
    'ARCHITECTURE.md',
  ],
};

const selectedScope = args.has('--scope')
  ? process.argv[process.argv.indexOf('--scope') + 1]
  : 'erp';

const selectedEntries = scopes[selectedScope];

if (!selectedEntries) {
  console.error(
    `[aidlc] Unknown scope "${selectedScope}". Available scopes: ${Object.keys(scopes).join(', ')}`,
  );
  process.exit(1);
}

const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.md']);
const ignoredSegments = new Set(['node_modules', '.next', '.git']);
const ignoredRelativePrefixes = [
  '.tmp-ui/',
  'tests/client/fixtures/',
];
const ignoredRelativeContains = [
  '/generated/',
  '/__snapshots__/',
];

async function collectFiles(entryPath) {
  const absolutePath = path.resolve(repoRoot, entryPath);
  const stat = await fs.stat(absolutePath);

  if (stat.isFile()) {
    return [absolutePath];
  }

  const result = [];
  const queue = [absolutePath];

  while (queue.length > 0) {
    const current = queue.pop();
    const children = await fs.readdir(current, { withFileTypes: true });

    for (const child of children) {
      if (ignoredSegments.has(child.name)) {
        continue;
      }

      const childPath = path.join(current, child.name);
      if (child.isDirectory()) {
        queue.push(childPath);
        continue;
      }

      if (allowedExtensions.has(path.extname(child.name))) {
        result.push(childPath);
      }
    }
  }

  return result;
}

function countLines(contents) {
  if (contents.length === 0) {
    return 0;
  }

  return contents.split(/\r?\n/).length;
}

function shouldIgnoreFile(relativePath) {
  if (ignoredRelativePrefixes.some((prefix) => relativePath.startsWith(prefix))) {
    return true;
  }

  return ignoredRelativeContains.some((segment) => relativePath.includes(segment));
}

const fileSet = new Set();
for (const entry of selectedEntries) {
  const files = await collectFiles(entry);
  for (const file of files) {
    fileSet.add(file);
  }
}

const results = [];
for (const file of [...fileSet].sort()) {
  const relativePath = path.relative(repoRoot, file);
  if (shouldIgnoreFile(relativePath)) {
    continue;
  }

  const contents = await fs.readFile(file, 'utf8');
  const lineCount = countLines(contents);
  if (lineCount <= targetLines) {
    continue;
  }

  results.push({
    file,
    lineCount,
    severity: lineCount > hardLines ? 'hard' : 'target',
  });
}

console.log(`[aidlc] scope=${selectedScope} target=${targetLines} hard=${hardLines}`);

if (results.length === 0) {
  console.log('[aidlc] No files exceeded the configured target.');
  process.exit(0);
}

const hardCount = results.filter((item) => item.severity === 'hard').length;
for (const item of results) {
  const relativePath = path.relative(repoRoot, item.file);
  const marker = item.severity === 'hard' ? 'HARD' : 'WARN';
  console.log(`[aidlc] ${marker} ${item.lineCount.toString().padStart(4, ' ')}  ${relativePath}`);
}

console.log(
  `[aidlc] ${results.length} file(s) exceeded ${targetLines} lines; ${hardCount} file(s) exceeded ${hardLines} lines.`,
);

if (strict) {
  process.exit(1);
}
