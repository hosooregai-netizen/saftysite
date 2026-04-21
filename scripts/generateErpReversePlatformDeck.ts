import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import {
  loadCompositions,
  loadIndustryPacks,
  loadReverseAdapters,
  loadReverseModules,
  loadReverseProvenance,
} from './erpReversePlatform';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
const outDir = path.join(repoRoot, 'docs', 'erp-reverse-platform');
const outPath = path.join(outDir, 'erp-reverse-platform-overview.pptx');
const SHAPES = {
  rect: 'rect',
  roundRect: 'roundRect',
} as const;

const theme = {
  head: { color: '17354A', fontFace: 'Aptos Display' },
  body: { color: '243846', fontFace: 'Aptos' },
  accent: { color: 'B55F24' },
  soft: { color: 'F3E7D9' },
  line: { color: 'D6E0E7' },
  paper: { color: 'FFFCF8' },
};

function addTitle(slide: any, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.65,
    y: 0.45,
    w: 11,
    h: 0.45,
    fontFace: theme.head.fontFace,
    fontSize: 28,
    bold: true,
    color: theme.head.color,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.68,
      y: 0.95,
      w: 10.8,
      h: 0.32,
      fontFace: theme.body.fontFace,
      fontSize: 11,
      color: '5C6B75',
    });
  }
}

function addBullets(slide: any, items: string[], x: number, y: number, w: number, h: number, fontSize = 16) {
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
      breakLine: true,
      paraSpaceAfter: 10,
      valign: 'top',
    },
  );
}

function addCard(slide: any, x: number, y: number, w: number, h: number, title: string, bullets: string[]) {
  slide.addShape(SHAPES.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: theme.paper.color },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.36,
    h: 0.25,
    fontFace: theme.head.fontFace,
    fontSize: 16,
    bold: true,
    color: theme.head.color,
  });
  addBullets(slide, bullets, x + 0.1, y + 0.46, w - 0.2, h - 0.54, 12);
}

function addFooter(slide: any, text: string) {
  slide.addText(text, {
    x: 0.65,
    y: 6.95,
    w: 11,
    h: 0.18,
    fontFace: theme.body.fontFace,
    fontSize: 9,
    color: '7A8790',
    align: 'right',
  });
}

function addCover(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F8F3EC' };
  slide.addShape(SHAPES.rect, {
    x: 0,
    y: 0,
    w: 3.35,
    h: 7.5,
    fill: { color: theme.head.color },
    line: { color: theme.head.color, pt: 0 },
  });
  slide.addShape(SHAPES.roundRect, {
    x: 3.0,
    y: 0.78,
    w: 0.45,
    h: 5.8,
    rectRadius: 0.08,
    fill: { color: theme.accent.color },
    line: { color: theme.accent.color, pt: 0 },
  });
  slide.addText('ERP Reverse Platform', {
    x: 3.88,
    y: 1.18,
    w: 6.6,
    h: 0.55,
    fontFace: theme.head.fontFace,
    fontSize: 26,
    bold: true,
    color: theme.head.color,
  });
  slide.addText('복구용 reverse와 분리된, 산업 재사용용 module catalog 운영 자료', {
    x: 3.92,
    y: 1.85,
    w: 7,
    h: 0.36,
    fontFace: theme.body.fontFace,
    fontSize: 14,
    color: theme.body.color,
  });
  slide.addText('modules + adapters + industry packs + compositions', {
    x: 3.92,
    y: 2.7,
    w: 6.5,
    h: 0.28,
    fontFace: theme.body.fontFace,
    fontSize: 16,
    color: theme.accent.color,
    bold: true,
  });
  addFooter(slide, 'Generated from scripts/generateErpReversePlatformDeck.ts');
}

function addLayerSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '1. Layer Model', '가드레일과 ERP reverse는 서로 다른 제품 프로그램으로 운영한다.');
  addCard(slide, 0.7, 1.45, 2.6, 2.2, 'Guardrails', [
    'Top-level feature contract',
    'Recovery slice',
    'Smoke, hook, CI',
    '현재 제품 회귀 방지',
  ]);
  addCard(slide, 3.55, 1.45, 2.6, 2.2, 'Platform Primitives', [
    '공통 shell/state/cache/output',
    '산업 간 재사용되는 기반 블록',
    '예: attachment, dashboard cache',
  ]);
  addCard(slide, 6.4, 1.45, 2.6, 2.2, 'Business Modules', [
    '사용자 목표 중심 capability',
    '화면명이 아니라 모듈 이름 사용',
    '예: periodic-report.source-sync',
  ]);
  addCard(slide, 9.25, 1.45, 2.0, 2.2, 'Packs + Tenant', [
    'Industry pack',
    'Tenant config',
    '조립과 변형 담당',
  ]);
  addBullets(slide, [
    'Recovery slice는 source evidence이고, reverse module은 cross-industry catalog 단위다.',
    '문서와 manifest를 같이 관리해야 no-code import나 조립 validator로 이어질 수 있다.',
  ], 0.9, 4.2, 10.4, 1.5, 15);
  addFooter(slide, 'ERP Reverse Platform');
}

function addInventorySlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  const modules = loadReverseModules();
  const adapters = loadReverseAdapters();
  const packs = loadIndustryPacks();
  const compositions = loadCompositions();
  const provenance = loadReverseProvenance();

  addTitle(slide, '2. Starter Inventory', '초기 카탈로그와 source-evidence 연결 수를 보여준다.');
  addCard(slide, 0.75, 1.4, 2.3, 2.0, 'Modules', [
    `${modules.length} total modules`,
    `${modules.filter((item) => item.manifest.category === 'platform-primitive').length} platform primitives`,
    `${modules.filter((item) => item.manifest.category === 'business-module').length} business modules`,
  ]);
  addCard(slide, 3.3, 1.4, 2.2, 2.0, 'Adapters', [
    `${adapters.length} adapter specs`,
    'external payload normalization',
    'industry/system boundary',
  ]);
  addCard(slide, 5.75, 1.4, 2.2, 2.0, 'Industry Packs', [
    `${packs.length} starter pack`,
    'policy overrides',
    'vocabulary + compliance',
  ]);
  addCard(slide, 8.2, 1.4, 2.3, 2.0, 'Compositions', [
    `${compositions.length} product composition`,
    'navigation + tenant bindings',
    'import-ready manifest',
  ]);
  addCard(slide, 0.75, 3.8, 9.75, 2.0, 'Provenance', [
    `${provenance.manifest.entries.length} recovery-slice links`,
    'changed source slices can mark downstream modules as review-needed',
    'crosswalk stays stable even if current route/file structure changes',
  ]);
  addFooter(slide, 'ERP Reverse Platform');
}

function addLifecycleSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '3. Lifecycle', '지속가능성은 validator와 provenance map까지 묶여야 생긴다.');
  slide.addShape(SHAPES.roundRect, {
    x: 0.8,
    y: 1.45,
    w: 10.4,
    h: 4.9,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(
    [
      'guarded source change',
      '  -> feature contract metadata resolves recovery slice',
      '  -> provenance map resolves reverse modules',
      '  -> validate:erp-reverse-platform checks doc + manifest + mapping freshness',
      '',
      'reverse authoring',
      '  -> module.md + module.manifest.json',
      '  -> adapter / pack / composition specs',
      '  -> publish only after sourceSlices + override surfaces validate cleanly',
    ].join('\n'),
    {
      x: 1.08,
      y: 1.8,
      w: 9.8,
      h: 4.0,
      fontFace: 'Aptos Mono',
      fontSize: 16,
      color: theme.body.color,
      breakLine: false,
    },
  );
  addFooter(slide, 'ERP Reverse Platform');
}

async function main() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'OpenAI Codex';
  pptx.company = 'OpenAI';
  pptx.subject = 'ERP Reverse Platform Overview';
  pptx.title = 'ERP Reverse Platform Overview';
  pptx.theme = {
    headFontFace: theme.head.fontFace,
    bodyFontFace: theme.body.fontFace,
  };

  addCover(pptx);
  addLayerSlide(pptx);
  addInventorySlide(pptx);
  addLifecycleSlide(pptx);

  await fs.mkdir(outDir, { recursive: true });
  await pptx.writeFile({ fileName: outPath });
  console.log(`[erp-reverse-platform] wrote ${path.relative(repoRoot, outPath)}`);
}

main().catch((error) => {
  console.error('[erp-reverse-platform] failed to generate deck.');
  console.error(error);
  process.exit(1);
});
