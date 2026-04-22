import path from 'node:path';

type TextToSvgInstance = {
  getPath(
    text: string,
    options: {
      anchor?: string;
      attributes?: Record<string, string>;
      fontSize: number;
      kerning?: boolean;
      x: number;
      y: number;
    },
  ): string;
};

type TextToSvgModule = {
  loadSync(fontPath?: string): TextToSvgInstance;
};

type ChartFontWeight = 400 | 500 | 700;
type ChartTextAnchor = 'left' | 'center' | 'right';
type ChartTextBaseline = 'baseline' | 'middle' | 'top';

interface RenderChartSvgTextPathOptions {
  fill: string;
  fontSize: number;
  fontWeight?: number;
  textAnchor?: ChartTextAnchor;
  textBaseline?: ChartTextBaseline;
  x: number;
  y: number;
}

const FONT_DIRECTORY = path.join(process.cwd(), 'public', 'fonts', 'noto-sans-kr');
const FONT_PATHS: Record<ChartFontWeight, string> = {
  400: path.join(FONT_DIRECTORY, 'noto-sans-kr-korean-400-normal.woff'),
  500: path.join(FONT_DIRECTORY, 'noto-sans-kr-korean-500-normal.woff'),
  700: path.join(FONT_DIRECTORY, 'noto-sans-kr-korean-700-normal.woff'),
};
const FONT_CACHE = new Map<ChartFontWeight, TextToSvgInstance>();

// `text-to-svg` is CommonJS-only, so we load it via `require` inside the server runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TextToSVG = require('text-to-svg') as TextToSvgModule;

function normalizeChartFontWeight(fontWeight: number | undefined): ChartFontWeight {
  if ((fontWeight ?? 400) >= 650) {
    return 700;
  }

  if ((fontWeight ?? 400) >= 450) {
    return 500;
  }

  return 400;
}

function resolveTextAnchor(textAnchor: ChartTextAnchor | undefined) {
  return textAnchor ?? 'left';
}

function resolveTextBaseline(textBaseline: ChartTextBaseline | undefined) {
  return textBaseline ?? 'baseline';
}

function getChartFont(weight: ChartFontWeight): TextToSvgInstance {
  const cached = FONT_CACHE.get(weight);
  if (cached) {
    return cached;
  }

  const font = TextToSVG.loadSync(FONT_PATHS[weight]);
  FONT_CACHE.set(weight, font);
  return font;
}

export function renderChartSvgTextPath(
  text: string,
  options: RenderChartSvgTextPathOptions,
): string {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return '';
  }

  const fontWeight = normalizeChartFontWeight(options.fontWeight);
  const textAnchor = resolveTextAnchor(options.textAnchor);
  const textBaseline = resolveTextBaseline(options.textBaseline);
  const font = getChartFont(fontWeight);

  return font.getPath(normalizedText, {
    anchor: `${textAnchor} ${textBaseline}`,
    attributes: {
      fill: options.fill,
    },
    fontSize: options.fontSize,
    kerning: true,
    x: options.x,
    y: options.y,
  });
}
