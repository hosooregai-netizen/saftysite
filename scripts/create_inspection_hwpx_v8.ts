import fs from 'node:fs/promises';
import path from 'node:path';

import JSZip from 'jszip';

type TemplateImagePlaceholder = {
  table: number;
  row: number;
  col: number;
  donorTable?: number;
  donorRow?: number;
  donorCol?: number;
  placeholderPath: string;
  binaryItemId: string;
  optional?: boolean;
};

type ManifestItem = {
  id: string;
  href: string;
  mediaType: string;
};

type CellDescriptor = {
  table: number;
  row: number;
  col: number;
};

const SECTION_XML_PATH = 'Contents/section0.xml';
const CONTENT_HPF_PATH = 'Contents/content.hpf';
const TEMPLATE_DIR = path.resolve(process.cwd(), 'public', 'templates', 'inspection');
const ZIP_STORED_ENTRY_NAMES = ['mimetype', 'version.xml', 'Preview/PrvImage.png'] as const;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_VERSION_MADE_BY = 0x0b17;
const ZIP_VERSION_NEEDED = 20;
const ZIP_DEFAULT_EXTERNAL_ATTR = 0x81800020;
const ZIP_OLE_EXTERNAL_ATTR = 0x81000021;

const IMAGE_PLACEHOLDERS: TemplateImagePlaceholder[] = [
  { table: 2, row: 2, col: 0, placeholderPath: 'sec3.fixed[0].photo_image', binaryItemId: 'tplimg01' },
  { table: 2, row: 2, col: 1, placeholderPath: 'sec3.fixed[1].photo_image', binaryItemId: 'tplimg02' },
  { table: 2, row: 4, col: 0, placeholderPath: 'sec3.extra[0].photo_image', binaryItemId: 'tplimg03' },
  { table: 2, row: 4, col: 1, placeholderPath: 'sec3.extra[1].photo_image', binaryItemId: 'tplimg04' },
  { table: 2, row: 6, col: 0, placeholderPath: 'sec3.extra[2].photo_image', binaryItemId: 'tplimg05' },
  {
    table: 2,
    row: 6,
    col: 1,
    donorTable: 2,
    donorRow: 6,
    donorCol: 2,
    placeholderPath: 'sec3.extra[3].photo_image',
    binaryItemId: 'tplimg06',
  },
  { table: 3, row: 2, col: 1, placeholderPath: 'sec4.follow_ups[0].before_image', binaryItemId: 'tplimg27' },
  { table: 3, row: 2, col: 4, placeholderPath: 'sec4.follow_ups[0].after_image', binaryItemId: 'tplimg28' },
  { table: 5, row: 2, col: 0, placeholderPath: 'sec7.findings[0].photo_image', binaryItemId: 'tplimg07' },
  { table: 5, row: 2, col: 5, placeholderPath: 'sec7.findings[0].photo_image_2', binaryItemId: 'tplimg08' },
  { table: 5, row: 8, col: 0, placeholderPath: 'sec7.findings[0].reference_material_1_image', binaryItemId: 'tplimg09' },
  { table: 5, row: 8, col: 5, placeholderPath: 'sec7.findings[0].reference_material_2_image', binaryItemId: 'tplimg10' },
  { table: 8, row: 2, col: 0, placeholderPath: 'sec10.measurements[0].photo_image', binaryItemId: 'tplimg11' },
  { table: 8, row: 7, col: 0, placeholderPath: 'sec10.measurements[1].photo_image', binaryItemId: 'tplimg12' },
  { table: 8, row: 12, col: 0, placeholderPath: 'sec10.measurements[2].photo_image', binaryItemId: 'tplimg13' },
  { table: 9, row: 2, col: 0, placeholderPath: 'sec11.education[0].photo_image', binaryItemId: 'tplimg14' },
  { table: 9, row: 2, col: 1, placeholderPath: 'sec11.education[0].material_image_or_file', binaryItemId: 'tplimg15' },
  { table: 9, row: 6, col: 0, placeholderPath: 'sec12.activities[0].photo_image', binaryItemId: 'tplimg16' },
  {
    table: 9,
    row: 6,
    col: 1,
    donorTable: 9,
    donorRow: 6,
    donorCol: 0,
    placeholderPath: 'sec12.activities[0].photo_image_2',
    binaryItemId: 'tplimg29',
  },
  { table: 10, row: 2, col: 0, placeholderPath: 'sec13.cases[0].image', binaryItemId: 'tplimg17' },
  { table: 10, row: 2, col: 1, placeholderPath: 'sec13.cases[1].image', binaryItemId: 'tplimg18' },
  { table: 10, row: 5, col: 0, placeholderPath: 'sec13.cases[2].image', binaryItemId: 'tplimg19' },
  { table: 10, row: 5, col: 1, placeholderPath: 'sec13.cases[3].image', binaryItemId: 'tplimg20' },
  { table: 11, row: 1, col: 0, placeholderPath: 'sec14.image', binaryItemId: 'tplimg21' },
  {
    table: 1,
    row: 14,
    col: 2,
    placeholderPath: 'sec2.notification_recipient_signature_image',
    binaryItemId: 'tplimg22',
    optional: true,
  },
];

function findVersionedTemplate(nameSuffix: string) {
  return fs.readdir(TEMPLATE_DIR).then((entries: string[]) => {
    const match = entries.find((entry) => entry.endsWith(nameSuffix));
    if (!match) {
      throw new Error(`Template file matching "${nameSuffix}" was not found under ${TEMPLATE_DIR}.`);
    }
    return path.join(TEMPLATE_DIR, match);
  });
}

function tableSpans(xml: string): Array<{ start: number; end: number }> {
  return Array.from(xml.matchAll(/<hp:tbl\b[\s\S]*?<\/hp:tbl>/g), (match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function locateTemplateCell(
  xml: string,
  descriptor: CellDescriptor,
): {
  tableSpan: { start: number; end: number };
  tableXml: string;
  cellXml: string;
  cellStart: number;
  cellEnd: number;
} | null {
  const spans = tableSpans(xml);
  const tableSpan = spans[descriptor.table];
  if (!tableSpan) {
    return null;
  }

  const tableXml = xml.slice(tableSpan.start, tableSpan.end);
  const marker = `<hp:cellAddr colAddr="${descriptor.col}" rowAddr="${descriptor.row}"`;

  for (const match of tableXml.matchAll(/<hp:tc\b[\s\S]*?<\/hp:tc>/g)) {
    const cellXml = match[0];
    if (!cellXml.includes(marker)) {
      continue;
    }

    const cellStart = match.index ?? 0;
    return {
      tableSpan,
      tableXml,
      cellXml,
      cellStart,
      cellEnd: cellStart + cellXml.length,
    };
  }

  return null;
}

function replaceLocatedTemplateCell(
  xml: string,
  located: {
    tableSpan: { start: number; end: number };
    tableXml: string;
    cellStart: number;
    cellEnd: number;
  },
  nextCellXml: string,
): string {
  const patchedTableXml =
    `${located.tableXml.slice(0, located.cellStart)}${nextCellXml}${located.tableXml.slice(located.cellEnd)}`;
  return `${xml.slice(0, located.tableSpan.start)}${patchedTableXml}${xml.slice(located.tableSpan.end)}`;
}

function extractCellSubListXml(cellXml: string): string | null {
  return cellXml.match(/<hp:subList\b[\s\S]*?<\/hp:subList>/)?.[0] ?? null;
}

function restoreTargetCellImageSlot(targetCellXml: string, donorCellXml: string): string | null {
  const targetSubListXml = extractCellSubListXml(targetCellXml);
  const donorSubListXml = extractCellSubListXml(donorCellXml);

  if (!targetSubListXml || !donorSubListXml) {
    return null;
  }

  return targetCellXml.replace(targetSubListXml, donorSubListXml);
}

function parseManifestItems(contentHpf: string): Map<string, ManifestItem> {
  const items = new Map<string, ManifestItem>();
  for (const match of contentHpf.matchAll(
    /<opf:item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"[^>]*\bmedia-type="([^"]+)"[^>]*/g,
  )) {
    items.set(match[1], {
      id: match[1],
      href: match[2],
      mediaType: match[3],
    });
  }
  return items;
}

function upsertManifestItem(contentHpf: string, id: string, href: string, mediaType: string): string {
  const nextItem = `<opf:item id="${id}" href="${href}" media-type="${mediaType}"/>`;
  if (new RegExp(`<opf:item\\b[^>]*\\bid="${id}"\\b`).test(contentHpf)) {
    return contentHpf.replace(
      new RegExp(`<opf:item\\b[^>]*\\bid="${id}"[^>]*/>`),
      nextItem,
    );
  }

  if (!contentHpf.includes('</opf:manifest>')) {
    throw new Error('content.hpf is missing </opf:manifest>.');
  }

  return contentHpf.replace('</opf:manifest>', `  ${nextItem}\n</opf:manifest>`);
}

function buildZipWriteOptions(
  entry: JSZip.JSZipObject | null | undefined,
  compression: 'STORE' | 'DEFLATE',
) {
  return {
    compression,
    createFolders: false,
    date: entry?.date,
    comment: entry?.comment,
    unixPermissions: entry?.unixPermissions,
    dosPermissions: entry?.dosPermissions,
  };
}

async function preserveStoredPackageEntries(zip: JSZip): Promise<void> {
  for (const fileName of ZIP_STORED_ENTRY_NAMES) {
    const entry = zip.file(fileName);
    if (!entry) {
      continue;
    }

    const content = await entry.async(fileName === 'mimetype' ? 'string' : 'uint8array');
    zip.file(fileName, content, buildZipWriteOptions(entry, 'STORE'));
  }
}

function removeDirectoryEntries(zip: JSZip): void {
  for (const fileName of Object.keys(zip.files)) {
    const zipEntry = zip.files[fileName];
    if (zipEntry?.dir) {
      delete zip.files[fileName];
    }
  }
}

function readZipHeaderDateMap(buffer: Uint8Array): Map<string, { modTime: number; modDate: number }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const entries = new Map<string, { modTime: number; modDate: number }>();
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Malformed ZIP central directory at entry ${entryIndex}.`);
    }

    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);

    entries.set(fileName, {
      modTime: view.getUint16(offset + 12, true),
      modDate: view.getUint16(offset + 14, true),
    });

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function patchZipHeadersForHwpx(buffer: Uint8Array, templateBuffer?: Uint8Array): Uint8Array {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const templateDates = templateBuffer ? readZipHeaderDateMap(templateBuffer) : new Map<string, { modTime: number; modDate: number }>();
  let eocdOffset = -1;
  for (let index = buffer.byteLength - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Generated ZIP is missing the end of central directory record.');
  }

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated ZIP central directory is malformed at entry ${entryIndex}.`);
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameBytes = buffer.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const generalPurposeFlag = compressionMethod === 8 ? 4 : 0;
    const externalAttr = fileName.endsWith('.ole') ? ZIP_OLE_EXTERNAL_ATTR : ZIP_DEFAULT_EXTERNAL_ATTR;
    const templateDate = templateDates.get(fileName);

    view.setUint16(offset + 4, ZIP_VERSION_MADE_BY, true);
    view.setUint16(offset + 6, ZIP_VERSION_NEEDED, true);
    view.setUint16(offset + 8, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(offset + 12, templateDate.modTime, true);
      view.setUint16(offset + 14, templateDate.modDate, true);
    }
    view.setUint16(offset + 36, 0, true);
    view.setUint16(offset + 38, externalAttr & 0xffff, true);
    view.setUint16(offset + 40, (externalAttr >>> 16) & 0xffff, true);

    if (view.getUint32(localHeaderOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error(`Generated ZIP local header is malformed for "${fileName}".`);
    }

    view.setUint16(localHeaderOffset + 4, ZIP_VERSION_NEEDED, true);
    view.setUint16(localHeaderOffset + 6, generalPurposeFlag, true);
    if (templateDate) {
      view.setUint16(localHeaderOffset + 10, templateDate.modTime, true);
      view.setUint16(localHeaderOffset + 12, templateDate.modDate, true);
    }

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return buffer;
}

async function mergeDonorManifestAssets(
  targetZip: JSZip,
  targetContentHpf: string,
  donorZip: JSZip,
  donorContentHpf: string,
): Promise<string> {
  let nextContentHpf = targetContentHpf;
  const targetManifestItems = parseManifestItems(targetContentHpf);
  const donorManifestItems = parseManifestItems(donorContentHpf);

  for (const donorItem of donorManifestItems.values()) {
    if (!donorItem.href.startsWith('BinData/')) {
      continue;
    }
    if (targetManifestItems.has(donorItem.id)) {
      continue;
    }

    const donorEntry = donorZip.file(donorItem.href);
    if (!donorEntry) {
      continue;
    }

    const donorContent = await donorEntry.async('uint8array');
    targetZip.file(donorItem.href, donorContent, buildZipWriteOptions(donorEntry, 'STORE'));
    nextContentHpf = upsertManifestItem(
      nextContentHpf,
      donorItem.id,
      donorItem.href,
      donorItem.mediaType,
    );
    targetManifestItems.set(donorItem.id, donorItem);
  }

  return nextContentHpf;
}

async function main() {
  const sourcePath = await findVersionedTemplate('annotated.v7.hwpx');
  const donorPath = await findVersionedTemplate('annotated.v6.hwpx');
  const outputPath = sourcePath.replace(/annotated\.v7\.hwpx$/, 'annotated.v8.hwpx');

  const sourceBuffer = await fs.readFile(sourcePath);
  const donorBuffer = await fs.readFile(donorPath);
  const sourceZip = await JSZip.loadAsync(sourceBuffer);
  const donorZip = await JSZip.loadAsync(donorBuffer);
  const sourceSectionEntry = sourceZip.file(SECTION_XML_PATH);
  const sourceContentEntry = sourceZip.file(CONTENT_HPF_PATH);
  const donorSectionEntry = donorZip.file(SECTION_XML_PATH);
  const donorContentEntry = donorZip.file(CONTENT_HPF_PATH);

  if (!sourceSectionEntry || !sourceContentEntry || !donorSectionEntry || !donorContentEntry) {
    throw new Error('Required HWPX package entries are missing.');
  }

  let sectionXml = await sourceSectionEntry.async('string');
  let contentHpf = await sourceContentEntry.async('string');
  const donorSectionXml = await donorSectionEntry.async('string');
  const donorContentHpf = await donorContentEntry.async('string');

  contentHpf = await mergeDonorManifestAssets(sourceZip, contentHpf, donorZip, donorContentHpf);

  let restoredCount = 0;
  const seenCells = new Set<string>();

  for (const descriptor of IMAGE_PLACEHOLDERS) {
    if (descriptor.optional) {
      continue;
    }

    const cellKey = `${descriptor.table}:${descriptor.row}:${descriptor.col}`;
    if (seenCells.has(cellKey)) {
      continue;
    }
    seenCells.add(cellKey);

    const targetCell = locateTemplateCell(sectionXml, descriptor);
    if (!targetCell) {
      throw new Error(`Target cell not found for ${descriptor.placeholderPath}.`);
    }
    if (targetCell.cellXml.includes('binaryItemIDRef="')) {
      continue;
    }

    const donorDescriptor = {
      table: descriptor.donorTable ?? descriptor.table,
      row: descriptor.donorRow ?? descriptor.row,
      col: descriptor.donorCol ?? descriptor.col,
    };
    const donorCell = locateTemplateCell(donorSectionXml, donorDescriptor);
    if (!donorCell || !donorCell.cellXml.includes('binaryItemIDRef="')) {
      throw new Error(`Donor cell with image slot not found for ${descriptor.placeholderPath}.`);
    }

    const restoredCellXml = restoreTargetCellImageSlot(targetCell.cellXml, donorCell.cellXml);
    if (!restoredCellXml) {
      throw new Error(`Failed to restore image slot for ${descriptor.placeholderPath}.`);
    }

    sectionXml = replaceLocatedTemplateCell(sectionXml, targetCell, restoredCellXml);
    restoredCount += 1;
  }

  sourceZip.file(SECTION_XML_PATH, sectionXml, buildZipWriteOptions(sourceSectionEntry, 'DEFLATE'));
  sourceZip.file(CONTENT_HPF_PATH, contentHpf, buildZipWriteOptions(sourceContentEntry, 'DEFLATE'));
  removeDirectoryEntries(sourceZip);
  await preserveStoredPackageEntries(sourceZip);

  const generatedBuffer = patchZipHeadersForHwpx(
    await sourceZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }),
    new Uint8Array(sourceBuffer),
  );
  await fs.writeFile(outputPath, Buffer.from(generatedBuffer));

  process.stdout.write(
    `${JSON.stringify(
      {
        sourcePath,
        donorPath,
        outputPath,
        restoredCount,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
