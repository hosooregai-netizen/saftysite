import type { ChartEntry } from './utils';

/**
 * 도넛 조각 색상 — 위에서부터 순서대로 순환 적용됩니다.
 * 채도 살짝 낮춘 팔레트(구분은 유지). 마음에 안 들면 아래 hex만 바꿔도 됩니다.
 */
export const CHART_DONUT_SEGMENT_COLORS = [
  '#4f8ae8',
  '#1aa8c8',
  '#2aa899',
  '#38b05a',
  '#d9b020',
  '#e88228',
  '#9b6ae8',
  '#e05a9a',
  '#6b6ee8',
  '#4cb0e8',
] as const;

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/** 단일 조각(360° 미만). 각도는 라디안, 12시 방향이 -π/2에서 시계 방향 증가. */
export function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const p1 = polar(cx, cy, outerR, startAngle);
  const p2 = polar(cx, cy, outerR, endAngle);
  const p3 = polar(cx, cy, innerR, endAngle);
  const p4 = polar(cx, cy, innerR, startAngle);
  const angleSpan = endAngle - startAngle;
  const largeArc = angleSpan > Math.PI ? 1 : 0;
  return [
    'M',
    p1.x,
    p1.y,
    'A',
    outerR,
    outerR,
    0,
    largeArc,
    1,
    p2.x,
    p2.y,
    'L',
    p3.x,
    p3.y,
    'A',
    innerR,
    innerR,
    0,
    largeArc,
    0,
    p4.x,
    p4.y,
    'Z',
  ].join(' ');
}

/** 한 항목이 100%일 때 전체 링 */
export function fullDonutRing(cx: number, cy: number, innerR: number, outerR: number): string {
  return [
    'M',
    cx + outerR,
    cy,
    'A',
    outerR,
    outerR,
    0,
    1,
    1,
    cx - outerR,
    cy,
    'A',
    outerR,
    outerR,
    0,
    1,
    1,
    cx + outerR,
    cy,
    'L',
    cx + innerR,
    cy,
    'A',
    innerR,
    innerR,
    0,
    1,
    0,
    cx - innerR,
    cy,
    'A',
    innerR,
    innerR,
    0,
    1,
    0,
    cx + innerR,
    cy,
    'Z',
  ].join(' ');
}

export interface DonutSlice {
  readonly path: string;
  readonly color: string;
  readonly label: string;
}

const OUTER_R = 40;
const INNER_R = 22;

export function buildDonutSlices(entries: ChartEntry[], total: number): DonutSlice[] {
  if (total <= 0 || entries.length === 0) return [];

  const cx = 0;
  const cy = 0;
  let angle = -Math.PI / 2;

  return entries.map((item, index) => {
    const fraction = item.count / total;
    const start = angle;
    const end = angle + fraction * 2 * Math.PI;
    angle = end;

    const path =
      entries.length === 1 && fraction >= 1 - 1e-9
        ? fullDonutRing(cx, cy, INNER_R, OUTER_R)
        : donutSegmentPath(cx, cy, INNER_R, OUTER_R, start, end);

    return {
      path,
      color: CHART_DONUT_SEGMENT_COLORS[index % CHART_DONUT_SEGMENT_COLORS.length],
      label: item.label,
    };
  });
}

