import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import metadata from '../tests/client/contracts/featureContractMetadata.json';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
const outDir = path.join(repoRoot, 'docs', 'guardrails');
const outPath = path.join(outDir, 'aidlc-guardrails-overview.pptx');
const SHAPES = {
  rect: 'rect',
  roundRect: 'roundRect',
} as const;

const theme = {
  head: { color: '123047', fontFace: 'Aptos Display' },
  body: { color: '20313F', fontFace: 'Aptos' },
  accent: { color: 'C87224' },
  soft: { color: 'F4E6D7' },
  line: { color: 'D7E0E7' },
  paper: { color: 'FFFDF9' },
};

function addTitle(slide: any, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.6,
    y: 0.45,
    w: 11.5,
    h: 0.45,
    fontFace: theme.head.fontFace,
    fontSize: 28,
    bold: true,
    color: theme.head.color,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.62,
      y: 0.95,
      w: 11.1,
      h: 0.35,
      fontFace: theme.body.fontFace,
      fontSize: 11,
      color: '5C6B75',
    });
  }
}

function addBullets(
  slide: any,
  items: string[],
  options: { x: number; y: number; w: number; h: number; fontSize?: number },
) {
  slide.addText(
    items.map((item) => ({
      text: item,
      options: { bullet: { indent: 14 } },
    })),
    {
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
      fontFace: theme.body.fontFace,
      fontSize: options.fontSize ?? 16,
      color: theme.body.color,
      breakLine: true,
      paraSpaceAfter: 10,
      valign: 'top',
    },
  );
}

function addInfoCard(
  slide: any,
  args: { x: number; y: number; w: number; h: number; title: string; body: string[] },
) {
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
    h: 0.28,
    fontFace: theme.head.fontFace,
    fontSize: 16,
    bold: true,
    color: theme.head.color,
  });
  addBullets(slide, args.body, {
    x: args.x + 0.1,
    y: args.y + 0.48,
    w: args.w - 0.22,
    h: args.h - 0.56,
    fontSize: 12,
  });
}

function addFooter(slide: any, text: string) {
  slide.addText(text, {
    x: 0.65,
    y: 6.95,
    w: 11.2,
    h: 0.18,
    fontFace: theme.body.fontFace,
    fontSize: 9,
    color: '7A8790',
    align: 'right',
  });
}

function addCoverSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F7F2EA' };
  slide.addShape(SHAPES.rect, {
    x: 0,
    y: 0,
    w: 3.4,
    h: 7.5,
    fill: { color: theme.head.color },
    line: { color: theme.head.color, pt: 0 },
  });
  slide.addShape(SHAPES.roundRect, {
    x: 3.05,
    y: 0.72,
    w: 0.46,
    h: 5.6,
    rectRadius: 0.08,
    fill: { color: theme.accent.color },
    line: { color: theme.accent.color, pt: 0 },
  });
  slide.addText('AIDLC Guardrails', {
    x: 3.95,
    y: 1.1,
    w: 6.8,
    h: 0.6,
    fontFace: theme.head.fontFace,
    fontSize: 26,
    bold: true,
    color: theme.head.color,
  });
  slide.addText('계약, 리버스 스펙, smoke, hook, CI가 어떻게 연결되는지 설명하는 운영 자료', {
    x: 3.98,
    y: 1.78,
    w: 7.2,
    h: 0.45,
    fontFace: theme.body.fontFace,
    fontSize: 14,
    color: theme.body.color,
  });
  slide.addText('saftysite-real', {
    x: 3.98,
    y: 2.55,
    w: 2.5,
    h: 0.3,
    fontFace: theme.body.fontFace,
    fontSize: 12,
    color: '5C6B75',
    bold: true,
  });
  slide.addText('Top-level contract + recovery slice + batch record', {
    x: 3.98,
    y: 2.95,
    w: 5.6,
    h: 0.3,
    fontFace: theme.body.fontFace,
    fontSize: 16,
    color: theme.accent.color,
    bold: true,
  });
  addFooter(slide, 'Generated from scripts/generateGuardrailsOverviewDeck.ts');
}

function addSummarySlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '1. 한 줄 요약', '현재 구조는 3층 역할 분리로 돌아간다.');
  addInfoCard(slide, {
    x: 0.7,
    y: 1.5,
    w: 3.5,
    h: 2.1,
    title: 'Top-level Feature Contract',
    body: [
      'Smoke와 push gating 단위',
      '기존 umbrella contract id를 유지',
      '예: admin-control-center, quarterly-report',
    ],
  });
  addInfoCard(slide, {
    x: 4.45,
    y: 1.5,
    w: 3.5,
    h: 2.1,
    title: 'Recovery Slice',
    body: [
      'Reverse spec와 세부 회귀 단위',
      '하나의 주 사용자 목표 + 하나의 주 state/controller 소유권',
      '예: quarterly-editor-source-sync',
    ],
  });
  addInfoCard(slide, {
    x: 8.2,
    y: 1.5,
    w: 3.0,
    h: 2.1,
    title: 'Batch Record',
    body: [
      '무엇을 바꿨는지와 검증 결과 기록',
      '작업 로그와 residual debt 보관',
    ],
  });
  addBullets(slide, [
    'Smoke/CI 단위는 기존 top-level contract를 유지해서 운영 비용을 안정화했다.',
    'Reverse spec은 더 작은 recovery slice로 내려서 재구성 정확도를 높였다.',
    '첫 migration wave는 admin-control-center, quarterly-report, site-report-list, mobile-link에 적용되어 있다.',
  ], { x: 0.9, y: 4.2, w: 10.8, h: 2.0, fontSize: 15 });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addArchitectureSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '2. 전체 구조도', '코드 변경은 metadata를 통해 contract/slice/smoke/doc으로 연결된다.');
  const diagram = [
    'source code',
    '  -> top-level feature contract',
    '     -> smoke id / guarded ownership',
    '  -> recovery slice',
    '     -> reverse spec / invariants / targeted checks',
    '  -> batch record',
    '     -> what changed / what passed / what is blocked',
    '',
    'local hooks',
    '  pre-commit -> verify:aidlc',
    '  pre-push   -> verify:aidlc:push',
    '',
    'remote CI',
    '  .github/workflows/aidlc.yml',
  ].join('\n');
  slide.addShape(SHAPES.roundRect, {
    x: 0.8,
    y: 1.45,
    w: 10.5,
    h: 4.95,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(diagram, {
    x: 1.1,
    y: 1.78,
    w: 9.8,
    h: 4.3,
    fontFace: 'Aptos Mono',
    fontSize: 16,
    color: theme.head.color,
    breakLine: false,
    margin: 0,
  });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addRuntimeSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '3. 실행 흐름', '커밋 전, 푸시 전, CI에서 서로 다른 레벨의 가드가 돈다.');
  addInfoCard(slide, {
    x: 0.7,
    y: 1.55,
    w: 3.5,
    h: 3.7,
    title: 'Pre-commit',
    body: [
      '`.githooks/pre-commit`',
      '`npm run verify:aidlc`',
      'proof/doc 동반 여부 검사',
      'recovery-slice validation',
      '`tsc`',
      'AIDLC audit',
    ],
  });
  addInfoCard(slide, {
    x: 4.45,
    y: 1.55,
    w: 3.5,
    h: 3.7,
    title: 'Pre-push',
    body: [
      '`.githooks/pre-push`',
      '`npm run verify:aidlc:push`',
      '변경 파일 -> contract metadata 매핑',
      '필요한 smoke id만 실행',
      '로컬 앱 가용성 확인',
    ],
  });
  addInfoCard(slide, {
    x: 8.2,
    y: 1.55,
    w: 3.0,
    h: 3.7,
    title: 'CI',
    body: [
      '`.github/workflows/aidlc.yml`',
      'changed files 재계산',
      'verify:aidlc equivalent',
      'verify:aidlc:push equivalent',
      '로컬 훅 우회 방지',
    ],
  });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addFileMapSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '4. 파일 맵', '핵심 파일은 네 묶음으로 보면 이해가 가장 쉽다.');
  addInfoCard(slide, {
    x: 0.7,
    y: 1.45,
    w: 5.1,
    h: 2.1,
    title: '계약과 메타데이터',
    body: [
      '`tests/client/contracts/adminContracts.ts`',
      '`tests/client/contracts/erpContracts.ts`',
      '`tests/client/featureContracts.ts`',
      '`tests/client/contracts/featureContractMetadata.json`',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 1.45,
    w: 5.1,
    h: 2.1,
    title: '검증 스크립트',
    body: [
      '`scripts/verifyAidlc.mjs`',
      '`scripts/verifyAidlcPush.mjs`',
      '`scripts/validateRecoverySlices.mjs`',
      '`scripts/aidlcAudit.mjs`',
    ],
  });
  addInfoCard(slide, {
    x: 0.7,
    y: 3.85,
    w: 5.1,
    h: 2.1,
    title: '설명과 문서',
    body: [
      '`ARCHITECTURE.md`',
      '`docs/reverse-specs/README.md`',
      '`docs/reverse-specs/feature-inventory.md`',
      '`docs/admin-aidlc/batch-47-feature-contract-recovery-slices.md`',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 3.85,
    w: 5.1,
    h: 2.1,
    title: '실행/증거 레이어',
    body: [
      '`.githooks/pre-commit` / `pre-push`',
      '`.github/workflows/aidlc.yml`',
      '`tests/client/runSmoke.ts`',
      '`tests/client/admin/*.spec.ts`, `tests/client/erp/*.spec.ts`',
    ],
  });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addManagedWaveSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  const managedContracts = Object.entries(metadata.contracts).filter(
    ([, contract]) => contract.enforceRecoverySlices,
  );
  const sliceCount = managedContracts.reduce(
    (sum, [, contract]) => sum + contract.recoverySlices.length,
    0,
  );
  addTitle(
    slide,
    '5. 현재 managed 범위',
    `Managed top-level contracts ${managedContracts.length}개, managed recovery slices ${sliceCount}개`,
  );
  const leftItems = managedContracts.slice(0, 2).map(([contractId, contract]) =>
    `${contractId}: ${contract.recoverySlices.map((slice) => slice.id).join(', ')}`,
  );
  const rightItems = managedContracts.slice(2).map(([contractId, contract]) =>
    `${contractId}: ${contract.recoverySlices.map((slice) => slice.id).join(', ')}`,
  );
  addInfoCard(slide, {
    x: 0.8,
    y: 1.6,
    w: 5.1,
    h: 4.2,
    title: '첫 migration wave',
    body: leftItems,
  });
  addInfoCard(slide, {
    x: 6.05,
    y: 1.6,
    w: 5.1,
    h: 4.2,
    title: '같이 관리되는 slice',
    body: rightItems,
  });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addSustainabilitySlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '6. 지속가능성 판단', '틀은 세워졌지만, 저장소 전체 자동 유지 단계는 아직 아니다.');
  addInfoCard(slide, {
    x: 0.75,
    y: 1.55,
    w: 5.0,
    h: 3.8,
    title: '지금 자동으로 유지되는 것',
    body: [
      'guarded file -> contract 매핑',
      'contract -> smoke id 매핑',
      'managed slice -> reverse spec path/header/inventory 정합성',
      'contract registry id와 metadata id 집합 정합성',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 1.55,
    w: 5.0,
    h: 3.8,
    title: '아직 더 필요한 것',
    body: [
      '남은 legacy contract들의 managed migration',
      'legacy umbrella reverse spec 분해',
      'batch doc 연계 강제 강화',
      '공용 계층 ownership 세분화',
    ],
  });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addUpdateFlowSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '7. 변경할 때 체크리스트', '새 기능보다 중요한 것은 변경 단위를 올바르게 고르는 것이다.');
  addBullets(slide, [
    '1. 영향받는 top-level feature contract를 식별한다.',
    '2. 영향받는 recovery slice를 식별한다.',
    '3. managed slice라면 reverse spec도 같이 갱신한다.',
    '4. smoke가 필요한 visible flow인지 확인하고 기존 smoke를 유지하거나 보강한다.',
    '5. batch doc에 실제 검증 결과와 blocker를 기록한다.',
    '6. verify:aidlc / verify:aidlc:push / CI가 같은 판단을 하도록 metadata를 기준으로 수정한다.',
  ], { x: 0.95, y: 1.65, w: 10.6, h: 4.8, fontSize: 18 });
  addFooter(slide, 'AIDLC Guardrails Overview');
}

function addAppendixSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '8. 참고 파일', '자세한 설명은 Markdown 설명서를 같이 본다.');
  addBullets(slide, [
    'docs/guardrails/aidlc-guardrails-overview.md',
    'tests/client/contracts/featureContractMetadata.json',
    'scripts/validateRecoverySlices.mjs',
    'scripts/verifyAidlc.mjs',
    'scripts/verifyAidlcPush.mjs',
    'docs/reverse-specs/feature-inventory.md',
    'ARCHITECTURE.md',
  ], { x: 0.95, y: 1.55, w: 10.2, h: 4.6, fontSize: 18 });
  addFooter(slide, 'Generated from scripts/generateGuardrailsOverviewDeck.ts');
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Codex';
  pptx.company = 'OpenAI';
  pptx.subject = 'AIDLC guardrails overview';
  pptx.title = 'AIDLC Guardrails Overview';
  pptx.theme = {
    headFontFace: theme.head.fontFace,
    bodyFontFace: theme.body.fontFace,
  };
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });

  addCoverSlide(pptx);
  addSummarySlide(pptx);
  addArchitectureSlide(pptx);
  addRuntimeSlide(pptx);
  addFileMapSlide(pptx);
  addManagedWaveSlide(pptx);
  addSustainabilitySlide(pptx);
  addUpdateFlowSlide(pptx);
  addAppendixSlide(pptx);

  await pptx.writeFile({ fileName: outPath });
  process.stdout.write(`${path.relative(repoRoot, outPath)}\n`);
}

void main();
