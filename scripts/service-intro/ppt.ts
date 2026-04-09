import fs from 'node:fs/promises';

import PptxGenJS from 'pptxgenjs';

import {
  ensureOutputRoot,
  getManifestPath,
  getPptPath,
  type IntroCaptureItem,
  type IntroManifest,
} from './config';

const COLORS = {
  ivory: 'F7F3EB',
  ivoryDeep: 'EFE8DA',
  green: '173B2F',
  greenSoft: '2B5A4A',
  gold: 'B8945A',
  goldSoft: 'D7C29A',
  ink: '1F2C28',
  muted: '5D695F',
  line: 'D8D1C2',
  white: 'FFFFFF',
};

const FEATURE_IMAGE_BOX = { x: 6.82, y: 1.32, w: 5.95, h: 4.72 };

function addSlideBase(slide: PptxGenJS.Slide) {
  slide.background = { color: COLORS.ivory };
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: COLORS.ivory },
    line: { color: COLORS.ivory, pt: 0 },
  });
}

function addCornerAccent(slide: PptxGenJS.Slide) {
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.28,
    fill: { color: COLORS.green },
    line: { color: COLORS.green, pt: 0 },
  });
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 12.22,
    y: 0.28,
    w: 1.113,
    h: 0.08,
    fill: { color: COLORS.gold },
    line: { color: COLORS.gold, pt: 0 },
  });
}

function addBadge(slide: PptxGenJS.Slide, text: string, x: number, y: number) {
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x,
    y,
    w: 1.28,
    h: 0.34,
    rectRadius: 0.06,
    fill: { color: COLORS.greenSoft },
    line: { color: COLORS.greenSoft, pt: 0 },
  });
  slide.addText(text, {
    x: x + 0.12,
    y: y + 0.06,
    w: 1.04,
    h: 0.18,
    fontFace: 'Pretendard',
    fontSize: 9.5,
    bold: true,
    color: COLORS.white,
    align: 'center',
  });
}

function addTitleBlock(
  slide: PptxGenJS.Slide,
  input: {
    eyebrow?: string;
    title: string;
    description?: string;
  },
) {
  if (input.eyebrow) {
    slide.addText(input.eyebrow, {
      x: 0.72,
      y: 0.52,
      w: 2.8,
      h: 0.2,
      fontFace: 'Pretendard',
      fontSize: 10,
      bold: true,
      color: COLORS.gold,
      charSpace: 0.4,
    });
  }
  slide.addText(input.title, {
    x: 0.72,
    y: 0.78,
    w: 6.9,
    h: 0.82,
    fontFace: 'Pretendard',
    fontSize: 24,
    bold: true,
    color: COLORS.green,
  });
  if (input.description) {
    slide.addText(input.description, {
      x: 0.72,
      y: 1.55,
      w: 7.1,
      h: 0.56,
      fontFace: 'Pretendard',
      fontSize: 11.5,
      color: COLORS.muted,
      breakLine: false,
    });
  }
}

function addMetricCard(
  slide: PptxGenJS.Slide,
  input: {
    x: number;
    y: number;
    title: string;
    body: string;
    accent?: string;
  },
) {
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: input.x,
    y: input.y,
    w: 2.85,
    h: 1.44,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 1 },
    shadow: { type: 'outer', color: 'CBBFA9', angle: 45, blur: 1.5, distance: 1, opacity: 0.08 },
  });
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: input.x,
    y: input.y,
    w: 2.85,
    h: 0.08,
    fill: { color: input.accent || COLORS.gold },
    line: { color: input.accent || COLORS.gold, pt: 0 },
  });
  slide.addText(input.title, {
    x: input.x + 0.18,
    y: input.y + 0.22,
    w: 2.45,
    h: 0.26,
    fontFace: 'Pretendard',
    fontSize: 13.5,
    bold: true,
    color: COLORS.ink,
  });
  slide.addText(input.body, {
    x: input.x + 0.18,
    y: input.y + 0.58,
    w: 2.45,
    h: 0.56,
    fontFace: 'Pretendard',
    fontSize: 10,
    color: COLORS.muted,
    breakLine: true,
  });
}

function addHighlightList(slide: PptxGenJS.Slide, highlights: string[], x = 0.9, y = 3.28) {
  highlights.forEach((item, index) => {
    const itemY = y + index * 0.62;
    slide.addShape(PptxGenJS.ShapeType.ellipse, {
      x,
      y: itemY + 0.05,
      w: 0.16,
      h: 0.16,
      fill: { color: COLORS.gold },
      line: { color: COLORS.gold, pt: 0 },
    });
    slide.addText(item, {
      x: x + 0.26,
      y: itemY,
      w: 5.15,
      h: 0.26,
      fontFace: 'Pretendard',
      fontSize: 12,
      color: COLORS.ink,
    });
  });
}

function addImpactStrip(slide: PptxGenJS.Slide, text: string) {
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 0.76,
    y: 6.5,
    w: 12,
    h: 0.46,
    rectRadius: 0.05,
    fill: { color: COLORS.ivoryDeep },
    line: { color: COLORS.goldSoft, pt: 1 },
  });
  slide.addText(`운영 효과  ${text}`, {
    x: 0.98,
    y: 6.61,
    w: 11.5,
    h: 0.18,
    fontFace: 'Pretendard',
    fontSize: 10,
    bold: true,
    color: COLORS.greenSoft,
  });
}

function addFeatureImage(slide: PptxGenJS.Slide, item: IntroCaptureItem) {
  const isWide = item.layoutVariant === 'wide';
  const imageBox = isWide
    ? { x: 6.02, y: 1.16, w: 6.72, h: 5.18 }
    : FEATURE_IMAGE_BOX;
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: imageBox.x - 0.14,
    y: imageBox.y - 0.14,
    w: imageBox.w + 0.28,
    h: imageBox.h + 0.28,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 1.2 },
    shadow: { type: 'outer', color: 'CBBFA9', angle: 45, blur: 2, distance: 1, opacity: 0.12 },
  });
  slide.addImage({
    path: item.imagePath,
    x: imageBox.x,
    y: imageBox.y,
    w: imageBox.w,
    h: imageBox.h,
  });
}

function addCoverSlide(pptx: PptxGenJS, manifest: IntroManifest) {
  const slide = pptx.addSlide();
  addSlideBase(slide);
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: COLORS.ivory },
    line: { color: COLORS.ivory, pt: 0 },
  });
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 0.7,
    y: 0.66,
    w: 5.7,
    h: 5.96,
    rectRadius: 0.1,
    fill: { color: COLORS.green },
    line: { color: COLORS.green, pt: 0 },
  });
  addBadge(slide, 'SERVICE', 0.96, 1.06);
  slide.addText('RegAI 현장안전\n운영 플랫폼', {
    x: 0.96,
    y: 1.62,
    w: 4.58,
    h: 1.3,
    fontFace: 'Pretendard',
    fontSize: 24,
    bold: true,
    color: COLORS.white,
    breakLine: true,
  });
  slide.addText(
    '현장 운영, 보고서 작성, 문서 출력, 메일 발송까지\n하나의 흐름으로 연결해 주는 외부 제안용 서비스 소개서입니다.',
    {
      x: 0.96,
      y: 3.16,
      w: 4.7,
      h: 0.88,
      fontFace: 'Pretendard',
      fontSize: 12.2,
      color: 'DDE6E1',
      breakLine: true,
    },
  );
  slide.addText('핵심 메시지', {
    x: 0.96,
    y: 4.45,
    w: 1.6,
    h: 0.22,
    fontFace: 'Pretendard',
    fontSize: 10,
    bold: true,
    color: COLORS.goldSoft,
  });
  slide.addText(
    [
      { text: '반복 입력과 문서 누락을 줄이고' },
      { text: '현장-본사 운영 흐름을 하나의 시스템으로 정리합니다.' },
    ],
    {
      x: 1.08,
      y: 4.78,
      w: 4.5,
      h: 0.82,
      fontFace: 'Pretendard',
      fontSize: 12,
      color: COLORS.white,
      breakLine: true,
      bullet: { indent: 12 },
    },
  );
  slide.addText(`생성 시각  ${manifest.generatedAt}`, {
    x: 0.96,
    y: 6.05,
    w: 3.7,
    h: 0.18,
    fontFace: 'Menlo',
    fontSize: 8,
    color: 'C3D0CA',
  });
  if (manifest.items[0]) {
    slide.addShape(PptxGenJS.ShapeType.roundRect, {
      x: 6.55,
      y: 0.74,
      w: 5.98,
      h: 5.98,
      rectRadius: 0.1,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, pt: 1.2 },
      shadow: { type: 'outer', color: 'CBBFA9', angle: 45, blur: 2, distance: 1, opacity: 0.15 },
    });
    slide.addImage({ path: manifest.items[0].imagePath, x: 6.75, y: 0.94, w: 5.58, h: 5.58 });
  }
}

function addProblemSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addSlideBase(slide);
  addCornerAccent(slide);
  addTitleBlock(slide, {
    eyebrow: 'WHY NOW',
    title: '현장안전 운영은 여러 업무가 끊겨 있기 쉽습니다',
    description:
      '보고서 작성, 현장 정보 관리, 문서 출력, 메일 발송이 나뉘어 있으면 반복 입력과 누락 리스크가 커집니다.',
  });
  addMetricCard(slide, {
    x: 0.82,
    y: 2.35,
    title: '반복 입력',
    body: '같은 정보를 여러 문서와 여러 화면에 다시 입력하게 됩니다.',
  });
  addMetricCard(slide, {
    x: 3.82,
    y: 2.35,
    title: '문서 누락',
    body: '작성, 저장, 출력, 공유 단계가 분리되면 누락과 버전 혼선이 생깁니다.',
  });
  addMetricCard(slide, {
    x: 6.82,
    y: 2.35,
    title: '현장 정보 분산',
    body: '사업장/현장 정보가 엑셀과 메신저, 메일함에 흩어져 관리됩니다.',
  });
  addMetricCard(slide, {
    x: 9.82,
    y: 2.35,
    title: '발송 추적 어려움',
    body: '누가 어떤 문서를 언제 보냈는지 이력 확인이 번거로워집니다.',
  });
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 0.82,
    y: 4.42,
    w: 11.86,
    h: 1.58,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 1.1 },
  });
  slide.addText('RegAI는 이 분리된 흐름을 “데이터 입력 → 보고서 작성 → 문서 출력 → 발송/공유”로 연결해 운영 복잡도를 줄이는 데 초점을 맞춥니다.', {
    x: 1.08,
    y: 4.9,
    w: 11.2,
    h: 0.46,
    fontFace: 'Pretendard',
    fontSize: 14,
    bold: true,
    color: COLORS.green,
    align: 'center',
  });
}

function addOutcomesSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  addSlideBase(slide);
  addCornerAccent(slide);
  addTitleBlock(slide, {
    eyebrow: 'OUTCOMES',
    title: '도입 효과는 기능보다 먼저 읽혀야 합니다',
    description: '정량 수치 대신 실제 운영자가 바로 체감하는 개선 효과를 중심으로 정리했습니다.',
  });
  addMetricCard(slide, {
    x: 0.82,
    y: 2.2,
    title: '반복 입력 감소',
    body: '엑셀 업로드와 공통 데이터 구조로 수작업 입력을 줄입니다.',
    accent: COLORS.greenSoft,
  });
  addMetricCard(slide, {
    x: 3.82,
    y: 2.2,
    title: '문서 누락 방지',
    body: '저장, 출력, 공유 흐름을 하나로 묶어 실수를 줄입니다.',
    accent: COLORS.greenSoft,
  });
  addMetricCard(slide, {
    x: 6.82,
    y: 2.2,
    title: '출력/발송 시간 단축',
    body: '보고서 생성과 메일 발송 준비를 같은 흐름으로 운영합니다.',
    accent: COLORS.greenSoft,
  });
  addMetricCard(slide, {
    x: 9.82,
    y: 2.2,
    title: '현장-본사 연결',
    body: '모바일/현장 흐름과 본사 운영 화면을 같은 체계로 정리합니다.',
    accent: COLORS.greenSoft,
  });
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 0.82,
    y: 4.48,
    w: 11.86,
    h: 1.24,
    rectRadius: 0.08,
    fill: { color: COLORS.ivoryDeep },
    line: { color: COLORS.goldSoft, pt: 1 },
  });
  slide.addText('핵심은 “기능이 많다”가 아니라, 기존 현장 운영 방식을 버리지 않고 흡수하면서도 운영 체계를 더 단단하게 만드는 것입니다.', {
    x: 1.02,
    y: 4.9,
    w: 11.45,
    h: 0.38,
    fontFace: 'Pretendard',
    fontSize: 13.2,
    bold: true,
    color: COLORS.green,
    align: 'center',
  });
}

function addFeatureSlide(pptx: PptxGenJS, item: IntroCaptureItem) {
  const slide = pptx.addSlide();
  addSlideBase(slide);
  addCornerAccent(slide);
  addTitleBlock(slide, {
    eyebrow: item.title.toUpperCase(),
    title: item.headline || item.title,
    description: item.subhead || item.description,
  });
  addHighlightList(slide, item.highlights || [], 0.92, 2.55);
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 0.84,
    y: 4.82,
    w: 4.98,
    h: 1.18,
    rectRadius: 0.06,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 1 },
  });
  slide.addText('핵심 포인트', {
    x: 1.06,
    y: 5.08,
    w: 1.6,
    h: 0.16,
    fontFace: 'Pretendard',
    fontSize: 9.5,
    bold: true,
    color: COLORS.gold,
  });
  slide.addText(item.description, {
    x: 1.06,
    y: 5.34,
    w: 4.3,
    h: 0.4,
    fontFace: 'Pretendard',
    fontSize: 10.5,
    color: COLORS.muted,
  });
  addFeatureImage(slide, item);
  addImpactStrip(slide, item.impactSummary || '운영 흐름을 더 빠르고 명확하게 만듭니다.');
}

function addClosingSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.green };
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: COLORS.green },
    line: { color: COLORS.green, pt: 0 },
  });
  slide.addText('RegAI가 제안하는 운영 방식', {
    x: 0.8,
    y: 0.82,
    w: 4.6,
    h: 0.38,
    fontFace: 'Pretendard',
    fontSize: 24,
    bold: true,
    color: COLORS.white,
  });
  slide.addText(
    [
      { text: '현장 운영과 문서 작업을 한 흐름으로 묶는 플랫폼' },
      { text: '데이터 입력부터 보고서 출력, 발송, 현장 연결까지 일관된 운영 경험' },
      { text: '기존 엑셀/보고서 운영 방식을 버리지 않고 흡수하는 구조' },
    ],
    {
      x: 0.94,
      y: 1.72,
      w: 6.1,
      h: 2.4,
      fontFace: 'Pretendard',
      fontSize: 16,
      color: COLORS.white,
      breakLine: true,
      bullet: { indent: 16 },
      paraSpaceAfterPt: 18,
    },
  );
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x: 7.45,
    y: 1.15,
    w: 4.98,
    h: 4.48,
    rectRadius: 0.08,
    fill: { color: '1E4A3B' },
    line: { color: COLORS.goldSoft, pt: 1 },
  });
  slide.addText('적합한 고객', {
    x: 7.78,
    y: 1.48,
    w: 1.9,
    h: 0.22,
    fontFace: 'Pretendard',
    fontSize: 11,
    bold: true,
    color: COLORS.goldSoft,
  });
  slide.addText(
    [
      { text: '여러 현장과 문서를 함께 관리하는 조직' },
      { text: '엑셀 기반 운영을 디지털 흐름으로 연결하려는 팀' },
      { text: '보고서 출력과 발송, 현장 실행을 하나의 체계로 묶고 싶은 고객' },
    ],
    {
      x: 7.78,
      y: 1.86,
      w: 4.0,
      h: 1.9,
      fontFace: 'Pretendard',
      fontSize: 11.5,
      color: COLORS.white,
      breakLine: true,
      bullet: { indent: 14 },
      paraSpaceAfterPt: 14,
    },
  );
  slide.addText('Next Step', {
    x: 7.78,
    y: 4.18,
    w: 1.5,
    h: 0.18,
    fontFace: 'Pretendard',
    fontSize: 11,
    bold: true,
    color: COLORS.goldSoft,
  });
  slide.addText('실제 운영 흐름 기준 데모와 도입 범위 정의를 함께 진행할 수 있습니다.', {
    x: 7.78,
    y: 4.54,
    w: 3.95,
    h: 0.56,
    fontFace: 'Pretendard',
    fontSize: 12,
    color: COLORS.white,
    breakLine: true,
  });
}

export async function buildServiceIntroDeck(manifest?: IntroManifest) {
  await ensureOutputRoot();
  const resolvedManifest =
    manifest ?? (JSON.parse(await fs.readFile(getManifestPath(), 'utf8')) as IntroManifest);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Codex';
  pptx.company = 'RegAI';
  pptx.subject = 'RegAI 외부형 서비스 소개';
  pptx.title = 'RegAI 서비스 소개서';
  pptx.lang = 'ko-KR';
  pptx.theme = {
    headFontFace: 'Pretendard',
    bodyFontFace: 'Pretendard',
    lang: 'ko-KR',
  };

  addCoverSlide(pptx, resolvedManifest);
  addProblemSlide(pptx);
  addOutcomesSlide(pptx);
  for (const item of resolvedManifest.items) {
    addFeatureSlide(pptx, item);
  }
  addClosingSlide(pptx);

  await pptx.writeFile({ fileName: getPptPath() });
  return getPptPath();
}
