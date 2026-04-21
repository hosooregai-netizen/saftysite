import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PptxGenJS from 'pptxgenjs';
import metadata from '../tests/client/contracts/featureContractMetadata.json';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
const outDir = path.join(repoRoot, 'docs', 'guardrails');
const outPath = path.join(outDir, 'aidlc-hooks-overview.pptx');
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

function addTitle(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
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
  slide: PptxGenJS.Slide,
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
  slide: PptxGenJS.Slide,
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

function addFooter(slide: PptxGenJS.Slide, text: string) {
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
  slide.addText('AIDLC Hook Runtime', {
    x: 3.95,
    y: 1.1,
    w: 6.8,
    h: 0.6,
    fontFace: theme.head.fontFace,
    fontSize: 26,
    bold: true,
    color: theme.head.color,
  });
  slide.addText('pre-commit / pre-push / CI가 어떤 변경을 어떻게 막는지 설명하는 운영 자료', {
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
  slide.addText('Staged snapshot + push ref diff + scope-aware smoke fallback', {
    x: 3.98,
    y: 2.95,
    w: 6.3,
    h: 0.3,
    fontFace: theme.body.fontFace,
    fontSize: 16,
    color: theme.accent.color,
    bold: true,
  });
  addFooter(slide, 'Generated from scripts/generateAidlcHooksOverviewDeck.ts');
}

function addSummarySlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  const contractCount = Object.keys(metadata.contracts).length;
  const smokeIds = new Set(
    Object.values(metadata.contracts).flatMap((contract) => contract.smokeScope.ids),
  );
  addTitle(
    slide,
    '1. 이번 개선 요약',
    `Managed contracts ${contractCount}개, smoke ids ${smokeIds.size}개 기준으로 local hook과 CI를 정렬했다.`,
  );
  addInfoCard(slide, {
    x: 0.7,
    y: 1.5,
    w: 3.5,
    h: 2.25,
    title: 'Pre-commit',
    body: [
      'working tree가 아니라 staged snapshot 기준으로 verify',
      '부분 staging과 미저장 작업이 섞여도 판정이 일관적',
      'metadata와 generated smoke registry drift도 commit 전에 검증',
    ],
  });
  addInfoCard(slide, {
    x: 4.45,
    y: 1.5,
    w: 3.5,
    h: 2.25,
    title: 'Pre-push',
    body: [
      '실제 push ref stdin을 읽어 diff 범위를 계산',
      '새 브랜치 push와 다른 대상 ref push를 더 정확히 판정',
      'metadata/doc/runner/generated registry 변경 시 scope-aware smoke 승격',
    ],
  });
  addInfoCard(slide, {
    x: 8.2,
    y: 1.5,
    w: 3.0,
    h: 2.25,
    title: 'CI Alignment',
    body: [
      '로컬 훅과 같은 verify script를 재사용',
      '변경 파일 전달형 실행을 유지',
      '로컬 우회가 있어도 main 보호선 유지',
    ],
  });
  addBullets(slide, [
    '핵심은 guarded source만이 아니라 metadata/harness/runner/canonical smoke doc 같은 guardrail 자체 변경도 놓치지 않는 것이다.',
    '로컬 개발 속도는 유지하면서도 잘못된 diff 범위 계산과 unstaged noise 때문에 생기던 오검출을 줄였다.',
  ], { x: 0.9, y: 4.25, w: 10.8, h: 1.9, fontSize: 15 });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addPreCommitSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '2. pre-commit 동작', '커밋 대상 snapshot을 잠깐 고정한 뒤 verify:aidlc를 실행한다.');
  addInfoCard(slide, {
    x: 0.75,
    y: 1.55,
    w: 5.0,
    h: 4.1,
    title: '현재 흐름',
    body: [
      'unstaged/untracked 변경이 있으면 `git stash --keep-index --include-untracked`',
      'staged index만 남긴 상태에서 `npm run verify:aidlc`',
      '종료 후 stash를 자동 복원',
      '복원 실패 시 stash 재적용 안내로 종료',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 1.55,
    w: 5.0,
    h: 4.1,
    title: '왜 필요한가',
    body: [
      '부분 staging 중인 파일 때문에 typecheck/audit가 흔들리지 않게 한다.',
      '“지금 커밋하려는 것”과 “작업 중인 것”을 분리해 판정한다.',
      'guarded source 삭제도 diff-filter에 포함해 companion 누락을 더 빨리 잡는다.',
      'smoke registry generated file이 stale이면 커밋 전에 바로 막는다.',
    ],
  });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addPrePushSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '3. pre-push 동작', 'Git이 넘겨주는 ref update stdin을 읽어 실제 push 범위를 계산한다.');
  slide.addShape(SHAPES.roundRect, {
    x: 0.85,
    y: 1.45,
    w: 10.8,
    h: 2.2,
    rectRadius: 0.08,
    fill: { color: 'FFFDFC' },
    line: { color: theme.line.color, pt: 1 },
  });
  slide.addText(
    [
      'pre-push stdin',
      '  local ref / local oid / remote ref / remote oid',
      '    -> updated ref별 changed files 계산',
      '      -> guarded source면 metadata 기반 targeted smoke',
      '      -> metadata or smoke/doc/runner config면 scoped smoke set',
      '        -> local app reachability 확인 후 Playwright smoke 실행',
    ].join('\n'),
    {
      x: 1.15,
      y: 1.78,
      w: 10.1,
      h: 1.55,
      fontFace: 'Aptos Mono',
      fontSize: 15,
      color: theme.head.color,
      margin: 0,
    },
  );
  addInfoCard(slide, {
    x: 0.95,
    y: 4.05,
    w: 4.8,
    h: 1.8,
    title: '일반 push',
    body: [
      '`remoteOid..localOid` diff로 필요한 smoke id만 수집',
      'ERP smoke가 하나라도 있으면 `auth`도 같이 포함',
    ],
  });
  addInfoCard(slide, {
    x: 5.95,
    y: 4.05,
    w: 5.0,
    h: 1.8,
    title: '새 ref push / config 변경',
    body: [
      'remote oid가 없으면 remote에 없는 commit 집합에서 파일을 합산',
      'metadata/harness/runner 변경이면 관련 scope smoke만 승격',
    ],
  });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addGuardrailConfigSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '4. guardrail 자체를 바꿀 때', '소스가 아니라 메타데이터와 smoke harness/runner만 바뀌어도 훅이 그냥 지나가지 않게 만들었다.');
  addInfoCard(slide, {
    x: 0.8,
    y: 1.55,
    w: 5.0,
    h: 3.9,
    title: 'Full validation 대상으로 보는 파일',
    body: [
      '`tests/client/contracts/featureContractMetadata.json`',
      '`tests/client/contracts/*.ts`, `tests/client/contracts/smoke-specs/**/*.md`',
      '`tests/client/featureContracts.ts`, `tests/client/smokeRegistry.generated.ts`',
      '`tests/client/fixtures/*SmokeHarness.ts`',
      '`tests/client/runSmoke.ts`, `scripts/generateSmokeRegistry.mjs`',
      '`scripts/listSmokeRegistryContractIds.ts`, `scripts/smoke*.ts`',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 1.55,
    w: 5.0,
    h: 3.9,
    title: '의미',
    body: [
      'guarded source가 없어도 `tsc`, recovery validation, ERP reverse validation은 돈다.',
      '필요할 때는 admin/ERP audit를 둘 다 태워서 drift를 줄인다.',
      'pre-push는 smoke mapping layer나 canonical doc linkage가 바뀌면 targeted smoke 대신 scope-aware smoke로 승격한다.',
    ],
  });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addFileMapSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '5. 관련 파일 맵', '훅 동작은 네 개의 파일 묶음으로 보면 가장 빠르게 이해된다.');
  addInfoCard(slide, {
    x: 0.7,
    y: 1.45,
    w: 5.1,
    h: 2.1,
    title: 'Hook 진입점',
    body: [
      '`.githooks/pre-commit`',
      '`.githooks/pre-push`',
      '`scripts/installGitHooks.mjs`',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 1.45,
    w: 5.1,
    h: 2.1,
    title: '판정 로직',
    body: [
      '`scripts/verifyAidlc.mjs`',
      '`scripts/verifyAidlcPush.mjs`',
      '`scripts/aidlcHookUtils.mjs`',
    ],
  });
  addInfoCard(slide, {
    x: 0.7,
    y: 3.85,
    w: 5.1,
    h: 2.1,
    title: '계약과 metadata',
    body: [
      '`scripts/aidlcContractMetadata.mjs`',
      '`tests/client/contracts/featureContractMetadata.json`',
      '`tests/client/featureContracts.ts`',
      '`tests/client/contracts/smoke-specs/**`',
    ],
  });
  addInfoCard(slide, {
    x: 6.0,
    y: 3.85,
    w: 5.1,
    h: 2.1,
    title: '실행 증거',
    body: [
      '`tests/client/runSmoke.ts`',
      '`tests/client/smokeRegistry.generated.ts`',
      '`tests/client/fixtures/*SmokeHarness.ts`',
      '`.github/workflows/aidlc.yml`',
    ],
  });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addChecklistSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '6. 운영 체크리스트', '새 feature보다 중요한 것은 hook과 metadata가 같은 판단을 하도록 유지하는 것이다.');
  addBullets(slide, [
    '1. guarded source를 건드렸다면 proof/doc/reverse spec이 같이 staged 되었는지 본다.',
    '2. smoke runner나 canonical smoke doc를 바꿨다면 metadata와 generated registry를 같이 갱신한다.',
    '3. contract metadata나 smoke harness를 바꿨다면 targeted smoke가 아니라 관련 scope smoke까지 각오한다.',
    '4. 다른 branch/ref로 push할 때도 pre-push가 실제 stdin ref를 읽는다는 전제를 유지한다.',
    '5. local hook을 우회할 수 있어도 CI가 같은 verify script를 다시 돌린다는 점을 문서에 남긴다.',
    '6. hook을 더 바꿀 때는 `tests/scripts/aidlcHookUtils.test.mjs`와 smoke registry 테스트를 같이 갱신한다.',
  ], { x: 0.95, y: 1.55, w: 10.5, h: 4.9, fontSize: 18 });
  addFooter(slide, 'AIDLC Hook Runtime');
}

function addAppendixSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addTitle(slide, '7. 참고 파일', '자세한 설명은 Markdown 설명서와 generator를 같이 본다.');
  addBullets(slide, [
    'docs/guardrails/aidlc-hooks-overview.md',
    'scripts/generateAidlcHooksOverviewDeck.ts',
    'scripts/aidlcHookUtils.mjs',
    'scripts/generateSmokeRegistry.mjs',
    'scripts/smokeRegistrySupport.mjs',
    'scripts/verifyAidlc.mjs',
    'scripts/verifyAidlcPush.mjs',
    '.githooks/pre-commit',
    '.githooks/pre-push',
  ], { x: 0.95, y: 1.55, w: 10.2, h: 4.6, fontSize: 18 });
  addFooter(slide, 'Generated from scripts/generateAidlcHooksOverviewDeck.ts');
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Codex';
  pptx.company = 'OpenAI';
  pptx.subject = 'AIDLC hook runtime overview';
  pptx.title = 'AIDLC Hook Runtime';
  pptx.theme = {
    headFontFace: theme.head.fontFace,
    bodyFontFace: theme.body.fontFace,
  };
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });

  addCoverSlide(pptx);
  addSummarySlide(pptx);
  addPreCommitSlide(pptx);
  addPrePushSlide(pptx);
  addGuardrailConfigSlide(pptx);
  addFileMapSlide(pptx);
  addChecklistSlide(pptx);
  addAppendixSlide(pptx);

  await pptx.writeFile({ fileName: outPath });
  process.stdout.write(`${path.relative(repoRoot, outPath)}\n`);
}

void main();
