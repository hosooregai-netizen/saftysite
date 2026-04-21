import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import { loadReverseModules, loadReverseProvenance } from './erpReversePlatform';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
const outDir = path.join(repoRoot, 'docs', 'erp-reverse-platform');
const outPath = path.join(outDir, 'erp-reverse-platform-introduction.pptx');
const SHAPES = {
  rect: 'rect',
  roundRect: 'roundRect',
  line: 'line',
} as const;

const theme = {
  head: { color: '18384F', fontFace: 'Aptos Display' },
  body: { color: '233645', fontFace: 'Aptos' },
  accent: { color: 'BA6326' },
  accentSoft: { color: 'F2E4D6' },
  line: { color: 'D7E1E8' },
  paper: { color: 'FFFCF8' },
  wash: { color: 'F7F2EB' },
};

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

function addBulletList(slide: any, items: string[], x: number, y: number, w: number, h: number, fontSize = 16) {
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

function addCard(slide: any, args: { x: number; y: number; w: number; h: number; title: string; body: string[] }) {
  slide.addShape(SHAPES.roundRect, {
    x: args.x,
    y: args.y,
    w: args.w,
    h: args.h,
    rectRadius: 0.08,
    fill: { color: theme.paper.color },
    line: { color: theme.line.color, pt: 1 },
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

function addChip(slide: any, text: string, x: number, y: number, w: number) {
  slide.addShape(SHAPES.roundRect, {
    x,
    y,
    w,
    h: 0.34,
    rectRadius: 0.08,
    fill: { color: theme.accentSoft.color },
    line: { color: theme.accent.color, pt: 1 },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.07,
    w: w - 0.16,
    h: 0.18,
    fontFace: theme.body.fontFace,
    fontSize: 10,
    bold: true,
    color: theme.accent.color,
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
  slide.addText('ERP Reverse\nPlatform Intro', {
    x: 3.95,
    y: 1.08,
    w: 4.2,
    h: 1.05,
    fontFace: theme.head.fontFace,
    fontSize: 28,
    bold: true,
    color: theme.head.color,
    breakLine: false,
  });
  slide.addText('가드레일, recovery slice, reusable module, API, server, 성능 budget까지 한 번에 설명하는 온보딩 deck', {
    x: 3.98,
    y: 2.06,
    w: 7.2,
    h: 0.5,
    fontFace: theme.body.fontFace,
    fontSize: 14,
    color: theme.body.color,
  });
  addChip(slide, 'current-product recovery', 3.98, 2.86, 2.05);
  addChip(slide, 'reusable ERP modules', 6.18, 2.86, 2.05);
  addChip(slide, 'API + server + budgets', 8.38, 2.86, 2.2);
  slide.addText('saftysite-real', {
    x: 3.98,
    y: 3.55,
    w: 2.4,
    h: 0.22,
    fontFace: theme.body.fontFace,
    fontSize: 12,
    bold: true,
    color: '5F6E79',
  });
  addFooter(slide, 'Generated from scripts/generateErpReversePlatformIntroDeck.ts');
}

function addWhySplitSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '1. Why Split', '복구용 reverse와 재사용용 reverse가 같은 단위로 움직이면 목적이 섞인다.');
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
      '다른 산업 ERP로 옮길 수 있는 capability 추출',
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
      '현재 라우트가 바뀌어도 module id는 유지된다',
      'API와 server도 capability 기준으로 묶인다',
    ],
  });
  addBulletList(slide, [
    'Recovery slice는 source evidence이고, reverse module은 cross-industry catalog 단위다.',
    '이 분리가 있어야 no-code import처럼 capability 단위로 가져갈 수 있다.',
  ], 0.92, 4.4, 10.1, 1.2, 15);
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
  addFooter(slide, 'ERP Reverse Platform Introduction');
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
    '시작 문서: docs/erp-reverse-platform/reverse-and-server-introduction.md',
    '발표 파일: docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx',
    '생성 스크립트: scripts/generateErpReversePlatformIntroDeck.ts',
  ], 0.94, 4.78, 10.0, 1.0, 14);
  addFooter(slide, 'ERP Reverse Platform Introduction');
}

async function main() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'OpenAI Codex';
  pptx.company = 'OpenAI';
  pptx.subject = 'ERP Reverse Platform Introduction';
  pptx.title = 'ERP Reverse Platform Introduction';
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

  await fs.mkdir(outDir, { recursive: true });
  await pptx.writeFile({ fileName: outPath });
  console.log(`[erp-reverse-platform] wrote ${path.relative(repoRoot, outPath)}`);
}

main().catch((error) => {
  console.error('[erp-reverse-platform] failed to generate introduction deck.');
  console.error(error);
  process.exit(1);
});

