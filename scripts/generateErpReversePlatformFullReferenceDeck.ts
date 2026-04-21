import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import { loadReverseModules, loadReverseProvenance } from './erpReversePlatform';

type ErpReverseDocType =
  | 'overview'
  | 'template'
  | 'adapter'
  | 'industry-pack'
  | 'composition'
  | 'platform-primitive'
  | 'business-module';

interface ParsedErpReverseDoc {
  path: string;
  title: string;
  docType: ErpReverseDocType;
  headings: string[];
  leadText: string | null;
  connectedArtifacts: string[];
  sectionMap: Record<string, string[]>;
}

interface ErpReverseDocSlideModel {
  title: string;
  subtitle: string;
  docTypeLabel: string;
  whatItIs: string[];
  keySections: string[];
  whyItMatters: string[];
  whenToOpen: string[];
  connectedArtifacts: string[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
const docsRoot = path.join(repoRoot, 'docs', 'erp-reverse-platform');
const outPath = path.join(docsRoot, 'erp-reverse-platform-full-reference.pptx');
const SHAPES = {
  rect: 'rect',
  roundRect: 'roundRect',
} as const;

const theme = {
  head: { color: '17374F', fontFace: 'Aptos Display' },
  body: { color: '233845', fontFace: 'Aptos' },
  accent: { color: 'BA6326' },
  accentSoft: { color: 'F2E4D6' },
  line: { color: 'D8E1E8' },
  paper: { color: 'FFFCF8' },
  wash: { color: 'F6F0E8' },
  typeColors: {
    overview: '16374D',
    template: '6F6B48',
    adapter: '7A4D28',
    'industry-pack': '2B6A57',
    composition: '5A4E88',
    'platform-primitive': '245D7A',
    'business-module': '9B4A37',
  } satisfies Record<ErpReverseDocType, string>,
};

function pathFromRoot(...segments: string[]) {
  return path.join(repoRoot, ...segments);
}

function toRepoRelative(filePath: string) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function trimLine(line: string) {
  return line.trim();
}

function stripMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-*]\s+/, '')
    .trim();
}

function splitSentences(text: string, max = 2) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => stripMarkdown(item))
    .filter(Boolean)
    .slice(0, max);
}

async function collectFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results.sort((left, right) => toRepoRelative(left).localeCompare(toRepoRelative(right)));
}

function classifyErpReverseDoc(relativePath: string, title: string): ErpReverseDocType {
  if (relativePath.endsWith('/adapter-template.md')) return 'template';
  if (relativePath.endsWith('/industry-pack-template.md')) return 'template';
  if (relativePath.endsWith('/composition-template.md')) return 'template';
  if (relativePath.endsWith('/module-template.md')) return 'template';
  if (relativePath.includes('/adapters/')) return 'adapter';
  if (relativePath.includes('/industry-packs/')) return 'industry-pack';
  if (relativePath.includes('/compositions/')) return 'composition';
  if (relativePath.includes('/modules/')) {
    const id = relativePath.split('/modules/')[1]?.split('/')[0] ?? title;
    return id.startsWith('platform-') ? 'platform-primitive' : 'business-module';
  }
  return 'overview';
}

function parseMarkdownOutline(relativePath: string, contents: string): ParsedErpReverseDoc {
  const lines = contents.split('\n');
  const titleLine = lines.find((line) => line.startsWith('# ')) ?? '# Untitled';
  const title = stripMarkdown(titleLine.replace(/^#\s+/, ''));
  const headings = lines
    .filter((line) => line.startsWith('## '))
    .map((line) => stripMarkdown(line.replace(/^##\s+/, '')));
  const sectionMap: Record<string, string[]> = {};
  let currentHeading: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('## ')) {
      currentHeading = stripMarkdown(line.replace(/^##\s+/, ''));
      sectionMap[currentHeading] = [];
      continue;
    }
    if (!currentHeading) continue;
    sectionMap[currentHeading].push(line);
  }

  const firstHeading = headings[0] ?? null;
  const leadText = firstHeading
    ? sectionMap[firstHeading]
      ?.map(trimLine)
      .filter((line) => line && !line.startsWith('##') && !line.startsWith('###'))
      .find((line) => !line.startsWith('- ') && !line.startsWith('|') && !line.startsWith('```'))
      ?? null
    : null;

  const connectedArtifacts = new Set<string>();
  const manifestCandidates = [
    relativePath.replace(/module\.md$/, 'module.manifest.json'),
    relativePath.replace(/adapter\.md$/, 'adapter.manifest.json'),
    relativePath.replace(/pack\.md$/, 'pack.manifest.json'),
    relativePath.replace(/composition\.md$/, 'composition.manifest.json'),
  ];

  for (const candidate of manifestCandidates) {
    if (candidate !== relativePath) {
      connectedArtifacts.add(candidate);
    }
  }

  const markdownLinkMatches = contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const match of markdownLinkMatches) {
    const target = match[1];
    if (!target.startsWith('/Users/')) continue;
    connectedArtifacts.add(toRepoRelative(target.replace(/:\d+$/, '')));
  }

  if (relativePath.endsWith('README.md')) {
    connectedArtifacts.add('docs/erp-reverse-platform/module-catalog.md');
    connectedArtifacts.add('scripts/validateErpReversePlatform.ts');
  }
  if (relativePath.endsWith('reverse-and-server-introduction.md')) {
    connectedArtifacts.add('scripts/probeSafetyApiLive.ts');
    connectedArtifacts.add('docs/current-system-architecture.md');
  }

  return {
    path: relativePath,
    title,
    docType: classifyErpReverseDoc(relativePath, title),
    headings,
    leadText,
    connectedArtifacts: [...connectedArtifacts].filter(Boolean),
    sectionMap,
  };
}

function docTypeLabel(docType: ErpReverseDocType) {
  switch (docType) {
    case 'overview':
      return 'Overview Doc';
    case 'template':
      return 'Template';
    case 'adapter':
      return 'Adapter';
    case 'industry-pack':
      return 'Industry Pack';
    case 'composition':
      return 'Composition';
    case 'platform-primitive':
      return 'Platform Primitive';
    case 'business-module':
      return 'Business Module';
  }
}

function limit(items: string[], max: number) {
  return items.map((item) => stripMarkdown(item)).filter(Boolean).slice(0, max);
}

function buildDocSummarySlideModel(parsedDoc: ParsedErpReverseDoc): ErpReverseDocSlideModel {
  const subtitle = parsedDoc.path;
  const keySections = limit(parsedDoc.headings, 6);
  const connectedArtifacts = limit(parsedDoc.connectedArtifacts, 4);

  let whatItIs = parsedDoc.leadText ? splitSentences(parsedDoc.leadText, 2) : [];
  let whyItMatters: string[] = [];
  let whenToOpen: string[] = [];

  switch (parsedDoc.docType) {
    case 'overview':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 reverse platform의 구조, 규칙, 또는 읽는 순서를 설명한다.'];
      whyItMatters = [
        '처음 진입하는 사람이 전체 구조를 빠르게 잡을 수 있다.',
        '다른 문서를 읽기 전에 기준 용어와 운영 원칙을 맞춘다.',
      ];
      whenToOpen = [
        '어떤 문서부터 읽어야 할지 모를 때',
        '가드레일과 reusable reverse의 차이를 다시 확인할 때',
      ];
      break;
    case 'template':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 새 reverse 문서를 작성할 때 빠뜨리지 말아야 할 항목을 알려주는 authoring guide다.'];
      whyItMatters = [
        '새 문서 추가 시 구조를 통일한다.',
        'API, server, performance 같은 필수 섹션 누락을 줄인다.',
      ];
      whenToOpen = [
        '새 module / adapter / pack / composition 문서를 만들 때',
        '기존 문서를 표준 포맷으로 정리할 때',
      ];
      break;
    case 'adapter':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 외부 payload나 산업별 규칙을 platform entity로 정규화하는 adapter를 설명한다.'];
      whyItMatters = [
        'route/payload 결합을 module 밖으로 밀어낸다.',
        'upstream drift를 adapter 경계에서 격리한다.',
      ];
      whenToOpen = [
        'payload naming이나 enum mapping을 이해해야 할 때',
        '외부 시스템 연결 규칙을 수정할 때',
      ];
      break;
    case 'industry-pack':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 특정 산업의 vocabulary, policy, compliance를 reusable module 위에 얹는 방법을 설명한다.'];
      whyItMatters = [
        '공통 module과 산업별 규칙을 분리한다.',
        '허용된 override surface만 사용하도록 돕는다.',
      ];
      whenToOpen = [
        '다른 산업 variant를 설계할 때',
        'policy override와 vocabulary를 검토할 때',
      ];
      break;
    case 'composition':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 하나의 실제 제품 구성을 어떤 module, adapter, tenant binding으로 조립하는지 설명한다.'];
      whyItMatters = [
        'module catalog가 실제 제품으로 조립되는 모습을 보여준다.',
        'navigation과 tenant binding까지 한 번에 추적할 수 있다.',
      ];
      whenToOpen = [
        '제품 단위 구성을 설명해야 할 때',
        'enabled modules와 navigation layout을 확인할 때',
      ];
      break;
    case 'platform-primitive':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 여러 business module이 공통으로 재사용하는 기반 capability를 설명한다.'];
      whyItMatters = [
        '공통 cache, list, document, asset 흐름의 책임 경계를 잡아준다.',
        '여러 module이 같은 기반을 공유할 때 중복 구현을 줄인다.',
      ];
      whenToOpen = [
        'shared capability를 수정하려 할 때',
        '하위 business module 여러 개가 같이 영향을 받을 때',
      ];
      break;
    case 'business-module':
      whatItIs = whatItIs.length > 0 ? whatItIs : ['이 문서는 산업을 넘어 재사용 가능한 사용자 목표 중심 capability를 설명한다.'];
      whyItMatters = [
        '현재 화면명이 아니라 재사용 가능한 모듈 단위를 기준으로 본다.',
        'API, server, performance budget까지 capability 단위로 묶는다.',
      ];
      whenToOpen = [
        '현재 기능을 다른 산업 ERP로 옮기려 할 때',
        '한 기능의 핵심 workflow와 guardrail을 빠르게 파악할 때',
      ];
      break;
  }

  return {
    title: parsedDoc.title,
    subtitle,
    docTypeLabel: docTypeLabel(parsedDoc.docType),
    whatItIs: limit(whatItIs, 2),
    keySections,
    whyItMatters: limit(whyItMatters, 2),
    whenToOpen: limit(whenToOpen, 2),
    connectedArtifacts,
  };
}

function extractSectionHighlights(parsedDoc: ParsedErpReverseDoc, heading: string, max: number) {
  const section = parsedDoc.sectionMap[heading] ?? [];
  const bullets = section
    .map(trimLine)
    .filter((line) => line.startsWith('- '))
    .map((line) => stripMarkdown(line))
    .slice(0, max);

  if (bullets.length > 0) {
    return bullets;
  }

  const paragraph = section
    .map(trimLine)
    .filter((line) => line && !line.startsWith('###') && !line.startsWith('```'))
    .find((line) => !line.startsWith('|'));

  return paragraph ? splitSentences(paragraph, max) : [];
}

function addTitle(slide: any, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.62,
    y: 0.42,
    w: 11.1,
    h: 0.42,
    fontFace: theme.head.fontFace,
    fontSize: 28,
    bold: true,
    color: theme.head.color,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.65,
      y: 0.92,
      w: 10.9,
      h: 0.28,
      fontFace: theme.body.fontFace,
      fontSize: 11,
      color: '5E6D77',
    });
  }
}

function addFooter(slide: any, text: string) {
  slide.addText(text, {
    x: 0.66,
    y: 6.95,
    w: 11,
    h: 0.16,
    fontFace: theme.body.fontFace,
    fontSize: 9,
    color: '7A8790',
    align: 'right',
  });
}

function addBulletList(slide: any, items: string[], x: number, y: number, w: number, h: number, fontSize = 15) {
  slide.addText(
    items.map((item) => ({
      text: item,
      options: { bullet: { indent: 14 } },
    })),
    {
      x,
      y,
      w,
      h,
      fontFace: theme.body.fontFace,
      fontSize,
      color: theme.body.color,
      paraSpaceAfter: 9,
      breakLine: true,
      valign: 'top',
    },
  );
}

function addCard(slide: any, args: { x: number; y: number; w: number; h: number; title: string; body: string[]; color?: string }) {
  slide.addShape(SHAPES.roundRect, {
    x: args.x,
    y: args.y,
    w: args.w,
    h: args.h,
    rectRadius: 0.08,
    fill: { color: theme.paper.color },
    line: { color: args.color ?? theme.line.color, pt: 1 },
  });
  slide.addText(args.title, {
    x: args.x + 0.18,
    y: args.y + 0.14,
    w: args.w - 0.36,
    h: 0.26,
    fontFace: theme.head.fontFace,
    fontSize: 16,
    bold: true,
    color: theme.head.color,
  });
  addBulletList(slide, args.body, args.x + 0.08, args.y + 0.44, args.w - 0.16, args.h - 0.56, 12);
}

function addChip(slide: any, text: string, x: number, y: number, w: number, color: string) {
  slide.addShape(SHAPES.roundRect, {
    x,
    y,
    w,
    h: 0.34,
    rectRadius: 0.08,
    fill: { color: theme.accentSoft.color },
    line: { color, pt: 1 },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.07,
    w: w - 0.16,
    h: 0.18,
    fontFace: theme.body.fontFace,
    fontSize: 10,
    bold: true,
    color,
    align: 'center',
  });
}

function addCover(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.wash.color };
  slide.addShape(SHAPES.rect, {
    x: 0,
    y: 0,
    w: 3.4,
    h: 7.5,
    fill: { color: theme.head.color },
    line: { color: theme.head.color, pt: 0 },
  });
  slide.addShape(SHAPES.roundRect, {
    x: 3.04,
    y: 0.78,
    w: 0.48,
    h: 5.7,
    rectRadius: 0.09,
    fill: { color: theme.accent.color },
    line: { color: theme.accent.color, pt: 0 },
  });
  slide.addText('ERP Reverse\nPlatform Full\nReference', {
    x: 3.95,
    y: 0.98,
    w: 4.8,
    h: 1.45,
    fontFace: theme.head.fontFace,
    fontSize: 26,
    bold: true,
    color: theme.head.color,
    breakLine: false,
  });
  slide.addText('개요 설명에 더해 docs/erp-reverse-platform 아래 모든 Markdown 문서를 문서별 장으로 정리한 reference deck', {
    x: 3.98,
    y: 2.35,
    w: 7.0,
    h: 0.48,
    fontFace: theme.body.fontFace,
    fontSize: 14,
    color: theme.body.color,
  });
  addChip(slide, 'overview + reference', 3.98, 3.08, 2.2, theme.accent.color);
  addChip(slide, 'all markdown docs', 6.36, 3.08, 2.0, theme.accent.color);
  addChip(slide, 'auto-generated index', 8.52, 3.08, 2.15, theme.accent.color);
  addFooter(slide, 'Generated from scripts/generateErpReversePlatformFullReferenceDeck.ts');
}

function addWhySplitSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '1. Why Split', '복구용 reverse와 재사용용 reverse는 목적이 달라서 같은 단위로 다루면 안 된다.');
  addCard(slide, {
    x: 0.72,
    y: 1.45,
    w: 3.45,
    h: 2.55,
    title: 'Current-Product Recovery',
    body: [
      'Top-level feature contract + recovery slice',
      '현재 앱 회귀 방지와 faithful rebuild 담당',
      '예: admin-overview-dashboard',
      '질문: 지금 화면을 똑같이 어떻게 복원하나?',
    ],
  });
  addCard(slide, {
    x: 4.42,
    y: 1.45,
    w: 3.45,
    h: 2.55,
    title: 'Reusable ERP Reverse',
    body: [
      'Platform primitive + business module + pack',
      '다른 산업 ERP로 옮길 capability 추출',
      '예: operations-dashboard.queue-overview',
      '질문: 어떤 capability를 재조립 가능한가?',
    ],
  });
  addCard(slide, {
    x: 8.12,
    y: 1.45,
    w: 2.75,
    h: 2.55,
    title: 'Why It Matters',
    body: [
      '화면명과 모듈명이 분리된다',
      'API와 server도 capability 기준으로 묶인다',
      '경로가 바뀌어도 module id는 유지된다',
    ],
  });
  addBulletList(slide, [
    'Recovery slice는 source evidence이고, reverse module은 cross-industry catalog 단위다.',
    '이 분리가 있어야 no-code import처럼 capability 단위 재조립이 가능하다.',
  ], 0.92, 4.4, 10.1, 1.2, 15);
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addStructureSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '2. Full Structure', '현재 저장소에서 어떤 파일이 어떤 역할을 가지는지 구조로 본다.');
  addCard(slide, {
    x: 0.72,
    y: 1.4,
    w: 2.55,
    h: 2.7,
    title: 'Guardrails',
    body: [
      'tests/client/contracts/*.ts',
      'featureContractMetadata.json',
      'docs/reverse-specs/',
      'verify:aidlc / smoke / CI',
    ],
  });
  addCard(slide, {
    x: 3.5,
    y: 1.4,
    w: 2.55,
    h: 2.7,
    title: 'Reverse Platform',
    body: [
      'docs/erp-reverse-platform/modules/*',
      'adapters / industry-packs / compositions',
      'provenance map',
      'validate:erp-reverse-platform',
    ],
  });
  addCard(slide, {
    x: 6.28,
    y: 1.4,
    w: 2.55,
    h: 2.7,
    title: 'Current Server',
    body: [
      'app/api/safety/[...path]',
      'app/api/admin/**',
      'app/api/photos/**',
      'app/api/documents/**',
    ],
  });
  addCard(slide, {
    x: 9.06,
    y: 1.4,
    w: 2.0,
    h: 2.7,
    title: 'Local Server',
    body: [
      'server/admin/**',
      'server/photos/**',
      'server/documents/**',
      'scripts/probeSafetyApiLive.ts',
    ],
  });
  slide.addShape(SHAPES.roundRect, {
    x: 0.88,
    y: 4.48,
    w: 10.05,
    h: 1.45,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText('workflow: guarded file change -> recovery slice -> reverse module -> API contract / server touchpoint / performance guardrail', {
    x: 1.15,
    y: 4.92,
    w: 9.5,
    h: 0.34,
    fontFace: 'Aptos Mono',
    fontSize: 15,
    color: theme.body.color,
  });
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addRequestFlowSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '3. Request Flow', '브라우저에서 시작한 호출이 어디를 지나 현재 server 코드에 도착하는지 보여준다.');
  slide.addShape(SHAPES.roundRect, {
    x: 0.84,
    y: 1.42,
    w: 10.15,
    h: 4.92,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(
    [
      'browser feature / screen',
      '  -> feature hook / client api helper',
      '  -> Next app/api route',
      '     -> proxy route: /api/safety/* -> external FastAPI /api/v1/*',
      '     -> local Next route: /api/admin/*, /api/photos/*, /api/documents/*',
      '  -> server/** helper or upstream ERP service',
      '  -> normalized response returns to the client',
      '  -> reverse module describes the stable capability boundary',
    ].join('\n'),
    {
      x: 1.1,
      y: 1.8,
      w: 9.6,
      h: 3.65,
      fontFace: 'Aptos Mono',
      fontSize: 16,
      color: theme.body.color,
    },
  );
  addBulletList(slide, [
    'proxy-backed ERP flows는 현재 저장소 밖의 FastAPI도 포함한다.',
    'admin/photos/documents는 이 저장소 안의 Next route + server helper 비중이 더 크다.',
  ], 1.02, 5.45, 9.5, 0.75, 13);
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addServerMapSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '4. Server Map', '처음 볼 때 가장 자주 찾게 되는 server 진입점들을 기능군으로 묶는다.');
  addCard(slide, {
    x: 0.72,
    y: 1.42,
    w: 2.55,
    h: 2.25,
    title: 'Proxy Entry',
    body: [
      'app/api/safety/[...path]/route.ts',
      '외부 FastAPI로 프록시',
      '일부 admin cache invalidation 트리거',
    ],
  });
  addCard(slide, {
    x: 3.52,
    y: 1.42,
    w: 2.55,
    h: 2.25,
    title: 'Admin Dashboard',
    body: [
      'app/api/admin/dashboard/**',
      'server/admin/overviewRouteCache.ts',
      'server/admin/analyticsSnapshot.ts',
    ],
  });
  addCard(slide, {
    x: 6.32,
    y: 1.42,
    w: 2.55,
    h: 2.25,
    title: 'Photos',
    body: [
      'app/api/photos/**',
      'server/photos/service.ts',
      'server/photos/album.ts',
    ],
  });
  addCard(slide, {
    x: 9.12,
    y: 1.42,
    w: 2.0,
    h: 2.25,
    title: 'Documents',
    body: [
      'app/api/documents/quarterly/**',
      'server/documents/quarterly/requestResolver.ts',
      'server/documents/quarterly/hwpx.ts',
    ],
  });
  addBulletList(slide, [
    'overview/analytics는 cache와 fallback merge가 핵심이다.',
    'photos는 context preservation과 bulk action semantics가 핵심이다.',
    'documents는 save-before-export와 fallback reuse가 핵심이다.',
  ], 0.92, 4.25, 9.8, 1.15, 14);
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addModuleAnatomySlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  const modules = loadReverseModules();
  const apiContractCount = modules.reduce((total, item) => total + item.manifest.apiContracts.length, 0);
  const guardrailCount = modules.reduce((total, item) => total + item.manifest.performanceGuardrails.length, 0);

  addTitle(slide, '5. Module Anatomy', 'published module은 이제 개념 설명이 아니라 API/server/performance 정보까지 가진다.');
  addCard(slide, {
    x: 0.72,
    y: 1.42,
    w: 3.0,
    h: 2.55,
    title: 'module.md',
    body: [
      'Purpose / State Model',
      'API Contracts',
      'Server Touchpoints',
      'Performance Guardrails',
      'Invariants / Industry Variability',
    ],
  });
  addCard(slide, {
    x: 3.97,
    y: 1.42,
    w: 3.0,
    h: 2.55,
    title: 'module.manifest.json',
    body: [
      'sourceSlices',
      'apiContracts',
      'serverTouchpoints',
      'performanceGuardrails',
      'tenant / industry surfaces',
    ],
  });
  addCard(slide, {
    x: 7.22,
    y: 1.42,
    w: 3.55,
    h: 2.55,
    title: 'Current Starter Stats',
    body: [
      `${modules.length} published modules`,
      `${apiContractCount} API contracts mapped`,
      `${guardrailCount} performance guardrails mapped`,
      'validator fails if these are missing',
    ],
  });
  slide.addShape(SHAPES.roundRect, {
    x: 0.86,
    y: 4.38,
    w: 9.95,
    h: 1.32,
    rectRadius: 0.08,
    fill: { color: theme.accentSoft.color },
    line: { color: theme.accent.color, pt: 1 },
  });
  slide.addText('practical rule: capability -> endpoint -> request/response -> server file -> performance budget', {
    x: 1.12,
    y: 4.82,
    w: 9.45,
    h: 0.26,
    fontFace: 'Aptos Mono',
    fontSize: 15,
    bold: true,
    color: theme.accent.color,
  });
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addExamplesSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '6. Example Mapping', '현재 앱 기능이 reusable module로 어떻게 올라가는지 대표 사례로 본다.');
  addCard(slide, {
    x: 0.72,
    y: 1.42,
    w: 3.25,
    h: 3.15,
    title: 'Overview Dashboard',
    body: [
      'recovery slice: admin-overview-dashboard',
      'module: operations-dashboard.queue-overview',
      'API: GET /api/admin/dashboard/overview',
      'server: overview route + route cache',
      'budget: 7000ms / 2500000 bytes',
    ],
  });
  addCard(slide, {
    x: 4.17,
    y: 1.42,
    w: 3.25,
    h: 3.15,
    title: 'Quarterly Source Sync',
    body: [
      'recovery slice: quarterly-editor-source-sync',
      'module: periodic-report.source-sync',
      'API: report by key + quarterly summary seed',
      'server: /api/safety proxy -> FastAPI',
      'budget: 2500ms lookup / 5000ms seed',
    ],
  });
  addCard(slide, {
    x: 7.62,
    y: 1.42,
    w: 3.15,
    h: 3.15,
    title: 'Photo Review',
    body: [
      'recovery slice: admin-photo-admin-flow',
      'module: asset-review.photo-workbench',
      'API: /api/photos + upload + download',
      'server: photos route + service + album',
      'budget: 3000ms list / 45000ms upload',
    ],
  });
  addBulletList(slide, [
    '중요한 점은 현재 화면 이름이 아니라 capability 이름으로 올라간다는 점이다.',
    '현재 route/file 구조가 바뀌어도 module id와 expected behavior는 계속 유지된다.',
  ], 0.92, 4.95, 10.0, 0.9, 13);
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addValidationSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  const provenance = loadReverseProvenance();

  addTitle(slide, '7. Sustainability', '지속가능성은 validator, provenance, live budget probe가 같이 돌 때 생긴다.');
  addCard(slide, {
    x: 0.72,
    y: 1.42,
    w: 3.0,
    h: 2.6,
    title: 'validate:recovery-slices',
    body: [
      'guarded file -> recovery slice mapping',
      'reverse spec header / inventory check',
      'current-product recovery freshness',
    ],
  });
  addCard(slide, {
    x: 3.97,
    y: 1.42,
    w: 3.0,
    h: 2.6,
    title: 'validate:erp-reverse-platform',
    body: [
      'module/doc pair completeness',
      'API/server/performance coverage',
      `${provenance.manifest.entries.length} provenance links currently tracked`,
    ],
  });
  addCard(slide, {
    x: 7.22,
    y: 1.42,
    w: 3.55,
    h: 2.6,
    title: 'verify:api-live-budgets',
    body: [
      '대표 live path latency / bytes probe',
      'Admin overview / analytics',
      'Site reports / report by key',
      'budget 초과 시 운영 경고 가능',
    ],
  });
  slide.addShape(SHAPES.roundRect, {
    x: 0.88,
    y: 4.34,
    w: 9.95,
    h: 1.5,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(
    [
      'guarded source change',
      '  -> recovery slice update',
      '  -> reusable module update if capability changed',
      '  -> provenance or API/server/performance metadata refresh',
      '  -> validators + smoke + optional live probe',
    ].join('\n'),
    {
      x: 1.15,
      y: 4.68,
      w: 9.35,
      h: 0.9,
      fontFace: 'Aptos Mono',
      fontSize: 14,
      color: theme.body.color,
    },
  );
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function addHowToUseSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '8. How To Use', '처음 보는 사람이 어디서 시작하면 되는지와, 변경 시 무엇을 업데이트해야 하는지 정리한다.');
  addCard(slide, {
    x: 0.72,
    y: 1.42,
    w: 5.0,
    h: 2.85,
    title: 'Reader Path',
    body: [
      '1. guardrails overview',
      '2. reverse-spec README',
      '3. reverse-and-server-introduction.md',
      '4. 원하는 module.md + module.manifest.json',
      '5. 대응 app/api/** 와 server/** 파일 확인',
    ],
  });
  addCard(slide, {
    x: 5.95,
    y: 1.42,
    w: 4.85,
    h: 2.85,
    title: 'Update Rule',
    body: [
      '현재 화면만 바뀌면 recovery spec 갱신',
      '재사용 capability도 바뀌면 module doc + manifest 갱신',
      'API가 바뀌면 API Contracts / Server Touchpoints / Performance Guardrails 갱신',
      '그 다음 validators 재실행',
    ],
  });
  addBulletList(slide, [
    '짧은 발표용: erp-reverse-platform-introduction.pptx',
    '문서별 reference용: erp-reverse-platform-full-reference.pptx',
    '시작 문서: docs/erp-reverse-platform/reverse-and-server-introduction.md',
  ], 0.94, 4.78, 10.0, 1.0, 14);
  addFooter(slide, 'ERP Reverse Platform Full Reference');
}

function sortDocs(docs: ParsedErpReverseDoc[]) {
  const order: ErpReverseDocType[] = [
    'overview',
    'template',
    'adapter',
    'industry-pack',
    'composition',
    'platform-primitive',
    'business-module',
  ];

  const priorityByPath = new Map<string, number>([
    ['docs/erp-reverse-platform/README.md', 0],
    ['docs/erp-reverse-platform/reverse-and-server-introduction.md', 1],
    ['docs/erp-reverse-platform/module-catalog.md', 2],
    ['docs/erp-reverse-platform/module-template.md', 3],
    ['docs/erp-reverse-platform/adapter-template.md', 4],
    ['docs/erp-reverse-platform/industry-pack-template.md', 5],
    ['docs/erp-reverse-platform/composition-template.md', 6],
  ]);

  return [...docs].sort((left, right) => {
    const leftPriority = priorityByPath.get(left.path);
    const rightPriority = priorityByPath.get(right.path);
    if (leftPriority != null || rightPriority != null) {
      return (leftPriority ?? 999) - (rightPriority ?? 999);
    }
    const typeCompare = order.indexOf(left.docType) - order.indexOf(right.docType);
    if (typeCompare !== 0) return typeCompare;
    return left.path.localeCompare(right.path);
  });
}

function addDocSummarySlide(pptx: PptxGenJS, parsedDoc: ParsedErpReverseDoc, index: number) {
  const slide = pptx.addSlide();
  const model = buildDocSummarySlideModel(parsedDoc);
  const accentColor = theme.typeColors[parsedDoc.docType];

  addTitle(slide, `${index}. ${model.title}`, model.subtitle);
  addChip(slide, model.docTypeLabel, 0.72, 1.2, 1.8, accentColor);

  addCard(slide, {
    x: 0.72,
    y: 1.65,
    w: 3.2,
    h: 2.1,
    title: 'What It Is',
    body: model.whatItIs,
    color: accentColor,
  });
  addCard(slide, {
    x: 4.15,
    y: 1.65,
    w: 3.0,
    h: 2.1,
    title: 'Why It Matters',
    body: model.whyItMatters,
    color: accentColor,
  });
  addCard(slide, {
    x: 7.38,
    y: 1.65,
    w: 3.42,
    h: 2.1,
    title: 'When To Open',
    body: model.whenToOpen,
    color: accentColor,
  });

  addCard(slide, {
    x: 0.72,
    y: 4.02,
    w: 4.1,
    h: 2.2,
    title: 'Key Sections',
    body: model.keySections,
    color: accentColor,
  });
  addCard(slide, {
    x: 5.05,
    y: 4.02,
    w: 5.75,
    h: 2.2,
    title: 'Connected Artifacts',
    body: model.connectedArtifacts.length > 0 ? model.connectedArtifacts : ['(none)'],
    color: accentColor,
  });

  addFooter(slide, `ERP Reverse Platform Full Reference | ${parsedDoc.path}`);
}

function addModuleDetailsSlide(pptx: PptxGenJS, parsedDoc: ParsedErpReverseDoc, index: number) {
  const slide = pptx.addSlide();
  const accentColor = theme.typeColors[parsedDoc.docType];

  addTitle(slide, `${index}. ${parsedDoc.title} Deep Dive`, parsedDoc.path);
  addChip(slide, 'Module Deep Dive', 0.72, 1.2, 1.95, accentColor);

  addCard(slide, {
    x: 0.72,
    y: 1.62,
    w: 3.3,
    h: 3.95,
    title: 'API Contracts',
    body: extractSectionHighlights(parsedDoc, 'API Contracts', 4),
    color: accentColor,
  });
  addCard(slide, {
    x: 4.24,
    y: 1.62,
    w: 3.05,
    h: 3.95,
    title: 'Server Touchpoints',
    body: extractSectionHighlights(parsedDoc, 'Server Touchpoints', 5),
    color: accentColor,
  });
  addCard(slide, {
    x: 7.51,
    y: 1.62,
    w: 3.29,
    h: 3.95,
    title: 'Performance Guardrails',
    body: extractSectionHighlights(parsedDoc, 'Performance Guardrails', 5),
    color: accentColor,
  });

  const variability = extractSectionHighlights(parsedDoc, 'Industry Variability', 2);
  const invariants = extractSectionHighlights(parsedDoc, 'Invariants', 2);
  addBulletList(slide, [
    ...invariants.map((item) => `Invariant: ${item}`),
    ...variability.map((item) => `Variability: ${item}`),
  ].slice(0, 4), 0.84, 5.92, 9.9, 0.75, 12);
  addFooter(slide, `ERP Reverse Platform Full Reference | ${parsedDoc.path}`);
}

function addIntroDeepDiveSlide(pptx: PptxGenJS, parsedDoc: ParsedErpReverseDoc, index: number) {
  const slide = pptx.addSlide();
  addTitle(slide, `${index}. ${parsedDoc.title} Deep Dive`, parsedDoc.path);
  addChip(slide, 'Overview Deep Dive', 0.72, 1.2, 1.95, theme.typeColors.overview);

  addCard(slide, {
    x: 0.72,
    y: 1.62,
    w: 3.25,
    h: 3.95,
    title: 'Core Questions',
    body: [
      '각 reverse artifact는 무엇을 위한 문서인가?',
      '브라우저 호출이 현재 server까지 어떻게 도착하는가?',
      'API contract와 budget은 어디서 보나?',
      '코드 변경 시 어떤 문서를 같이 갱신해야 하나?',
    ],
    color: theme.typeColors.overview,
  });
  addCard(slide, {
    x: 4.2,
    y: 1.62,
    w: 3.1,
    h: 3.95,
    title: 'Server Entry Guide',
    body: [
      'app/api/safety/[...path]/route.ts',
      'app/api/admin/dashboard/**',
      'app/api/photos/**',
      'app/api/documents/quarterly/**',
      'server/** helpers',
    ],
    color: theme.typeColors.overview,
  });
  addCard(slide, {
    x: 7.52,
    y: 1.62,
    w: 3.28,
    h: 3.95,
    title: 'Operational Anchors',
    body: [
      'scripts/probeSafetyApiLive.ts',
      'apiContracts / serverTouchpoints',
      'performanceGuardrails',
      'update rule for docs and manifests',
    ],
    color: theme.typeColors.overview,
  });

  addFooter(slide, `ERP Reverse Platform Full Reference | ${parsedDoc.path}`);
}

async function loadAllParsedDocs() {
  const files = await collectFiles(docsRoot);
  const parsedDocs: ParsedErpReverseDoc[] = [];
  for (const filePath of files) {
    const contents = await fs.readFile(filePath, 'utf8');
    const relativePath = toRepoRelative(filePath);
    parsedDocs.push(parseMarkdownOutline(relativePath, contents));
  }
  return sortDocs(parsedDocs);
}

async function main() {
  const parsedDocs = await loadAllParsedDocs();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'OpenAI Codex';
  pptx.company = 'OpenAI';
  pptx.subject = 'ERP Reverse Platform Full Reference';
  pptx.title = 'ERP Reverse Platform Full Reference';
  pptx.theme = {
    headFontFace: theme.head.fontFace,
    bodyFontFace: theme.body.fontFace,
  };

  addCover(pptx);
  addWhySplitSlide(pptx);
  addStructureSlide(pptx);
  addRequestFlowSlide(pptx);
  addServerMapSlide(pptx);
  addModuleAnatomySlide(pptx);
  addExamplesSlide(pptx);
  addValidationSlide(pptx);
  addHowToUseSlide(pptx);

  let slideIndex = 9;
  for (const parsedDoc of parsedDocs) {
    addDocSummarySlide(pptx, parsedDoc, slideIndex);
    slideIndex += 1;

    if (parsedDoc.path.endsWith('reverse-and-server-introduction.md')) {
      addIntroDeepDiveSlide(pptx, parsedDoc, slideIndex);
      slideIndex += 1;
      continue;
    }

    if (parsedDoc.docType === 'platform-primitive' || parsedDoc.docType === 'business-module') {
      addModuleDetailsSlide(pptx, parsedDoc, slideIndex);
      slideIndex += 1;
    }
  }

  await fs.mkdir(docsRoot, { recursive: true });
  await pptx.writeFile({ fileName: outPath });
  console.log(`[erp-reverse-platform] wrote ${toRepoRelative(outPath)}`);
}

main().catch((error) => {
  console.error('[erp-reverse-platform] failed to generate full reference deck.');
  console.error(error);
  process.exit(1);
});

