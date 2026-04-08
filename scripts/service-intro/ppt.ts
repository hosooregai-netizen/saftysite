import fs from 'node:fs/promises';

import PptxGenJS from 'pptxgenjs';

import {
  ensureOutputRoot,
  getManifestPath,
  getPptPath,
  type IntroCaptureItem,
  type IntroManifest,
} from './config';

function addImageSlide(pptx: PptxGenJS, item: IntroCaptureItem) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F7F4EC' };
  slide.addText(item.title, {
    x: 0.45, y: 0.28, w: 6.8, h: 0.45,
    fontFace: 'Pretendard', fontSize: 24, bold: true, color: '173B2F',
  });
  slide.addText(item.description, {
    x: 0.45, y: 0.74, w: 7.8, h: 0.42,
    fontFace: 'Pretendard', fontSize: 10.5, color: '4C5B55',
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.42, y: 1.2, w: 12.45, h: 5.72,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: 'D8D0C0', pt: 1.2 },
    shadow: { type: 'outer', color: 'CFC6B6', angle: 45, blur: 2, distance: 1, opacity: 0.12 },
  });
  slide.addImage({ path: item.imagePath, x: 0.58, y: 1.36, w: 12.1, h: 5.38 });
  slide.addText(item.route, {
    x: 0.58, y: 6.86, w: 12.1, h: 0.22,
    fontFace: 'Menlo', fontSize: 7.5, color: '8C8375',
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
  pptx.subject = 'RegAI 서비스 소개';
  pptx.title = 'RegAI 서비스 소개서';
  pptx.lang = 'ko-KR';
  pptx.theme = {
    headFontFace: 'Pretendard',
    bodyFontFace: 'Pretendard',
    lang: 'ko-KR',
  };

  const cover = pptx.addSlide();
  cover.background = { color: 'F3EFE6' };
  cover.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: 'F3EFE6' }, line: { color: 'F3EFE6', pt: 0 },
  });
  cover.addText('RegAI 서비스 소개', {
    x: 0.72, y: 1.08, w: 5.4, h: 0.8,
    fontFace: 'Pretendard', fontSize: 26, bold: true, color: '173B2F',
  });
  cover.addText('운영 대시보드부터 사업장·현장 관리, 문서 출력, 메일 운영까지 실제 화면 기준으로 정리했습니다.', {
    x: 0.72, y: 1.95, w: 5.7, h: 0.9,
    fontFace: 'Pretendard', fontSize: 13, color: '43534E',
  });
  cover.addText(`생성 시각: ${resolvedManifest.generatedAt}`, {
    x: 0.72, y: 2.95, w: 4.5, h: 0.28,
    fontFace: 'Menlo', fontSize: 8, color: '7A7265',
  });
  if (resolvedManifest.items[0]) {
    cover.addShape(pptx.ShapeType.roundRect, {
      x: 6.3, y: 0.72, w: 6.35, h: 5.95,
      rectRadius: 0.08,
      fill: { color: 'FFFFFF' },
      line: { color: 'D8D0C0', pt: 1.2 },
    });
    cover.addImage({ path: resolvedManifest.items[0].imagePath, x: 6.5, y: 0.92, w: 5.95, h: 5.55 });
  }

  for (const item of resolvedManifest.items) {
    addImageSlide(pptx, item);
  }

  const closing = pptx.addSlide();
  closing.background = { color: '173B2F' };
  closing.addText('도입 메시지', {
    x: 0.72, y: 0.86, w: 3.4, h: 0.5,
    fontFace: 'Pretendard', fontSize: 24, bold: true, color: 'F7F4EC',
  });
  closing.addText(
    [
      { text: '현장 운영, 문서 출력, 메일 발송, 모바일 흐름을 한 제품 안에서 연결합니다.' },
      { text: '사업장/현장 컨텍스트형 엑셀 업로드로 데이터 반영 전 미리보기를 제공합니다.' },
      { text: '기술지도·분기·신고서 출력은 서버 생성 중심으로 정리해 대용량 413 이슈를 줄였습니다.' },
    ],
    {
      x: 0.82, y: 1.72, w: 11.3, h: 3.1,
      fontFace: 'Pretendard', fontSize: 16, color: 'F7F4EC',
      breakLine: true, bullet: { indent: 14 },
      paraSpaceAfterPt: 16,
    },
  );
  closing.addText('텍스트와 강조 도형은 PowerPoint에서 직접 수정 가능합니다.', {
    x: 0.82, y: 5.72, w: 8.6, h: 0.3,
    fontFace: 'Pretendard', fontSize: 10.5, color: 'D9E4DE',
  });

  await pptx.writeFile({ fileName: getPptPath() });
  return getPptPath();
}
