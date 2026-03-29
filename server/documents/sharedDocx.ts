import 'server-only';

import JSZip from 'jszip';
import {
  buildContentTypeDefaults,
  buildDocumentRelationships,
} from '@/server/documents/inspection/media';
import type { DocumentMediaAsset } from '@/server/documents/inspection/media';

export interface GeneratedWordDocument {
  buffer: Buffer;
  filename: string;
}

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const CONTENT_TYPES_PREFIX = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
`;

const CONTENT_TYPES_SUFFIX = `
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic" w:hAnsi="Malgun Gothic"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`;

export function sanitizeWordFileName(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/[\\/:*?"<>|]/g, '-').trim();
  return normalized || fallback;
}

export function createWordDocumentDownloadResponse(document: GeneratedWordDocument): Response {
  return new Response(new Uint8Array(document.buffer), {
    status: 200,
    headers: {
      'Content-Type': DOCX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
    },
  });
}

export async function buildWordDocumentArchive(options: {
  assets?: DocumentMediaAsset[];
  body: string;
  filename: string;
  title: string;
}): Promise<GeneratedWordDocument> {
  const now = new Date().toISOString();
  const zip = new JSZip();
  const assets = options.assets ?? [];
  const contentTypes = `${CONTENT_TYPES_PREFIX}${buildContentTypeDefaults(assets)}${CONTENT_TYPES_SUFFIX}`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.folder('_rels')?.file('.rels', ROOT_RELS);
  zip.folder('word')?.file('document.xml', options.body);
  zip.folder('word')?.file('styles.xml', STYLES_XML);
  zip
    .folder('word')
    ?.folder('_rels')
    ?.file('document.xml.rels', buildDocumentRelationships(assets));
  assets.forEach((asset) => {
    zip.folder('word')?.folder('media')?.file(asset.filename, asset.buffer);
  });
  zip
    .folder('docProps')
    ?.file(
      'core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <dc:title>${options.title}</dc:title>
        <dc:creator>SafetySite</dc:creator>
        <cp:lastModifiedBy>SafetySite</cp:lastModifiedBy>
        <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
        <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
      </cp:coreProperties>`
    );
  zip
    .folder('docProps')
    ?.file(
      'app.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
        <Application>SafetySite</Application>
      </Properties>`
    );

  return {
    buffer: await zip.generateAsync({ compression: 'DEFLATE', type: 'nodebuffer' }),
    filename: options.filename,
  };
}
