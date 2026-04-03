import 'server-only';

import JSZip from 'jszip';

import type { TableExportColumn } from '@/types/admin';

interface WorkbookSheetInput {
  columns: TableExportColumn[];
  name: string;
  rows: Array<Record<string, unknown>>;
}

interface WorkbookInput {
  sheets: WorkbookSheetInput[];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnNumberToName(columnNumber: number) {
  let current = columnNumber;
  let result = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

function normalizeSheetName(name: string, index: number) {
  const normalized = name.replace(/[\\/*?:[\]]/g, ' ').trim() || `Sheet${index + 1}`;
  return normalized.slice(0, 31);
}

function buildCellXml(cellRef: string, value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${cellRef}"><v>${value}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `<c r="${cellRef}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  const text = String(value ?? '');
  return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function buildWorksheetXml(columns: TableExportColumn[], rows: Array<Record<string, unknown>>) {
  const headerRow = columns
    .map((column, index) => buildCellXml(`${columnNumberToName(index + 1)}1`, column.label))
    .join('');
  const dataRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) =>
          buildCellXml(
            `${columnNumberToName(columnIndex + 1)}${rowNumber}`,
            row[column.key],
          ),
        )
        .join('');
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<sheetData>',
    `<row r="1">${headerRow}</row>`,
    dataRows,
    '</sheetData>',
    '</worksheet>',
  ].join('');
}

function buildWorkbookXml(sheetNames: string[]) {
  const sheetsXml = sheetNames
    .map(
      (name, index) =>
        `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<sheets>${sheetsXml}</sheets>`,
    '</workbook>',
  ].join('');
}

function buildWorkbookRelsXml(sheetCount: number) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) => {
    const relationIndex = index + 1;
    return `<Relationship Id="rId${relationIndex}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${relationIndex}.xml"/>`;
  }).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    sheetRels,
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    '</Relationships>',
  ].join('');
}

function buildContentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    sheetOverrides,
    '</Types>',
  ].join('');
}

const ROOT_RELS_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
  '</Relationships>',
].join('');

const STYLES_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
  '</styleSheet>',
].join('');

function buildCoreXml(timestamp: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    '<dc:creator>Codex</dc:creator>',
    '<cp:lastModifiedBy>Codex</cp:lastModifiedBy>',
    `<dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>`,
    '</cp:coreProperties>',
  ].join('');
}

function buildAppXml(sheetNames: string[]) {
  const titles = sheetNames.map((name) => `<vt:lpstr>${escapeXml(name)}</vt:lpstr>`).join('');
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>Codex</Application>',
    `<TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>`,
    '</Properties>',
  ].join('');
}

export async function buildWorkbookXlsxBuffer(input: WorkbookInput): Promise<Buffer> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString();
  const sheetNames = input.sheets.map((sheet, index) => normalizeSheetName(sheet.name, index));

  zip.file('[Content_Types].xml', buildContentTypesXml(input.sheets.length));
  zip.folder('_rels')?.file('.rels', ROOT_RELS_XML);
  zip.folder('docProps')?.file('core.xml', buildCoreXml(timestamp));
  zip.folder('docProps')?.file('app.xml', buildAppXml(sheetNames));
  zip.folder('xl')?.file('workbook.xml', buildWorkbookXml(sheetNames));
  zip.folder('xl')?.folder('_rels')?.file('workbook.xml.rels', buildWorkbookRelsXml(input.sheets.length));
  zip.folder('xl')?.file('styles.xml', STYLES_XML);

  input.sheets.forEach((sheet, index) => {
    zip
      .folder('xl')
      ?.folder('worksheets')
      ?.file(`sheet${index + 1}.xml`, buildWorksheetXml(sheet.columns, sheet.rows));
  });

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}
