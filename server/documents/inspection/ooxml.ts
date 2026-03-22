import 'server-only';

import type { EmbeddedImage } from './media';

const BORDER = `
  <w:tblBorders>
    <w:top w:val="single" w:sz="8" w:color="8894A3"/>
    <w:left w:val="single" w:sz="8" w:color="8894A3"/>
    <w:bottom w:val="single" w:sz="8" w:color="8894A3"/>
    <w:right w:val="single" w:sz="8" w:color="8894A3"/>
    <w:insideH w:val="single" w:sz="8" w:color="8894A3"/>
    <w:insideV w:val="single" w:sz="8" w:color="8894A3"/>
  </w:tblBorders>
`;

export interface TableCellSpec {
  align?: 'left' | 'center';
  bold?: boolean;
  colSpan?: number;
  content: string;
  shaded?: boolean;
  type?: 'text' | 'xml';
  verticalAlign?: 'top' | 'center';
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textRun(text: string, bold = false, size?: number) {
  const runProps = [
    bold ? '<w:b/>' : '',
    size ? `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` : '',
  ]
    .filter(Boolean)
    .join('');
  const props = runProps ? `<w:rPr>${runProps}</w:rPr>` : '';
  return `<w:r>${props}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

export function paragraph(
  text: string,
  options: {
    align?: 'left' | 'center';
    bold?: boolean;
    size?: number;
    spacingAfter?: number;
    spacingBefore?: number;
  } = {}
) {
  const lines = (text || ' ').split('\n');
  const runs = lines
    .flatMap((line, index) =>
      index === 0 ? [textRun(line || ' ', options.bold, options.size)] : ['<w:r><w:br/></w:r>', textRun(line || ' ', options.bold, options.size)]
    )
    .join('');
  const pPr = [
    options.align ? `<w:jc w:val="${options.align}"/>` : '',
    options.spacingAfter != null ? `<w:spacing w:after="${options.spacingAfter}"/>` : '',
    options.spacingBefore != null ? `<w:spacing w:before="${options.spacingBefore}"/>` : '',
  ]
    .filter(Boolean)
    .join('');
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`;
}

export function rawParagraph(
  content: string,
  options: { align?: 'left' | 'center'; spacingAfter?: number } = {}
) {
  const pPr = [
    options.align ? `<w:jc w:val="${options.align}"/>` : '',
    options.spacingAfter != null ? `<w:spacing w:after="${options.spacingAfter}"/>` : '',
  ]
    .filter(Boolean)
    .join('');
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${content}</w:p>`;
}

function cellParagraphs(text: string, bold = false, align: 'left' | 'center' = 'left') {
  return (text || '-')
    .split('\n')
    .map((line) => paragraph(line || ' ', { align, bold }))
    .join('');
}

function sumWidths(widths: number[], start: number, span: number) {
  return widths.slice(start, start + span).reduce((total, width) => total + width, 0);
}

export function textCell(
  content: string,
  options: Omit<TableCellSpec, 'content' | 'type'> = {}
): TableCellSpec {
  return { ...options, content, type: 'text' };
}

export function xmlCell(
  content: string,
  options: Omit<TableCellSpec, 'content' | 'type'> = {}
): TableCellSpec {
  return { ...options, content, type: 'xml' };
}

export function table(
  rows: TableCellSpec[][],
  widths: number[],
  options: { width?: number } = {}
) {
  const tableWidth = options.width ?? widths.reduce((total, width) => total + width, 0);
  return `
    <w:tbl>
      <w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/>${BORDER}</w:tblPr>
      <w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>
      ${rows
        .map((row) => {
          let columnIndex = 0;
          const cells = row
            .map((cell) => {
              const span = cell.colSpan ?? 1;
              const width = sumWidths(widths, columnIndex, span);
              columnIndex += span;
              const tcPr = [
                `<w:tcW w:w="${width}" w:type="dxa"/>`,
                cell.shaded ? '<w:shd w:val="clear" w:fill="F6F8FB"/>' : '',
                span > 1 ? `<w:gridSpan w:val="${span}"/>` : '',
                `<w:vAlign w:val="${cell.verticalAlign ?? 'top'}"/>`,
              ]
                .filter(Boolean)
                .join('');
              const content =
                cell.type === 'xml'
                  ? cell.content
                  : cellParagraphs(cell.content, cell.bold, cell.align);
              return `<w:tc><w:tcPr>${tcPr}</w:tcPr>${content}</w:tc>`;
            })
            .join('');
          return `<w:tr>${cells}</w:tr>`;
        })
        .join('')}
    </w:tbl>
  `;
}

export function twoColTable(rows: Array<{ label: string; value: string }>, labelWidth = 2800) {
  const widths = [labelWidth, 9200 - labelWidth];
  return table(
    rows.map((row) => [textCell(row.label, { bold: true, shaded: true }), textCell(row.value)]),
    widths,
    { width: 9200 }
  );
}

export function gridTable(rows: string[][], widths: number[], headerRowCount = 0) {
  return table(
    rows.map((row, rowIndex) =>
      row.map((cell) => textCell(cell, { bold: rowIndex < headerRowCount, shaded: rowIndex < headerRowCount }))
    ),
    widths,
    { width: 9200 }
  );
}

export function imageParagraph(
  image: EmbeddedImage,
  options: { align?: 'left' | 'center'; spacingAfter?: number } = {}
) {
  const imageName = image.filename;
  return rawParagraph(
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${image.widthEmu}" cy="${image.heightEmu}"/>
      <wp:docPr id="${image.docPrId}" name="${escapeXml(imageName)}" descr="${escapeXml(imageName)}"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:nvPicPr>
              <pic:cNvPr id="${image.docPrId}" name="${escapeXml(imageName)}"/>
              <pic:cNvPicPr/>
            </pic:nvPicPr>
            <pic:blipFill>
              <a:blip r:embed="${image.relId}"/>
              <a:stretch><a:fillRect/></a:stretch>
            </pic:blipFill>
            <pic:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="${image.widthEmu}" cy="${image.heightEmu}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline></w:drawing></w:r>`,
    options
  );
}

export function imageBlock(
  image: EmbeddedImage | null,
  alt: string,
  options: { align?: 'left' | 'center'; spacingAfter?: number } = {}
) {
  return image ? imageParagraph(image, options) : paragraph(`${alt} 없음`, { align: options.align, spacingAfter: options.spacingAfter });
}

export function titleBox(text: string) {
  return table([[textCell(text, { bold: true, align: 'center', verticalAlign: 'center' })]], [9200], { width: 9200 });
}

export function pageBanner() {
  return paragraph('함께해요 안전작업, 함께해요 안전한국 · 한국종합안전 (02-2299-1996)', {
    align: 'center',
    spacingAfter: 140,
  });
}

export function pageFooter(pageNumber: number) {
  return paragraph(`- ${pageNumber} -`, { align: 'center' });
}

export function sectionHeading(text: string) {
  return paragraph(text, { bold: true, size: 28, spacingAfter: 120, spacingBefore: 80 });
}

export function subsectionHeading(text: string) {
  return paragraph(text, { bold: true, spacingAfter: 80 });
}

export function noteBox(text: string) {
  return table([[textCell(text, { shaded: true })]], [9200], { width: 9200 });
}

export function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

export function buildDocumentXml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable="w14 wp14">
    <w:body>
      ${body}
      <w:sectPr>
        <w:pgSz w:w="11906" w:h="16838"/>
        <w:pgMar w:top="794" w:right="794" w:bottom="907" w:left="794" w:header="567" w:footer="567" w:gutter="0"/>
      </w:sectPr>
    </w:body>
  </w:document>`;
}
