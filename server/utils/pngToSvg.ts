import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { darken, normHex, pickBackground } from '../../utils/color';

const traceP = promisify(potrace.trace);

const SIZE = 512;

// 거리² 임계값 (RGB 공간):
//  - BG_NEAR_DIST2: 배경색에서 이만큼 가까우면 무조건 배경 — anti-aliasing 의
//    회색 톤도 흡수
//  - COLOR_FAR_DIST2: base/stroke 양쪽 모두에서 이만큼 멀면 배경 — 모델이
//    잘못 깐 회색 같은 노이즈 차단
const BG_NEAR_DIST2 = 60 * 60;
const COLOR_FAR_DIST2 = 80 * 80;

export type PngToSvgOptions = {
  baseHex: string;
  backgroundHex?: '#FFFFFF' | '#000000';
};

type Rgb = [number, number, number];
type Klass = 'bg' | 'base' | 'stroke';

function hexToRgb(hex: string): Rgb {
  const n = normHex(hex).slice(1);
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function dist2(a: Rgb, b: Rgb): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function classifyFactory(baseRgb: Rgb, strokeRgb: Rgb, bgRgb: Rgb) {
  return function classify(data: Buffer, i: number): Klass {
    if (data[i + 3]! < 128) return 'bg';
    const rgb: Rgb = [data[i]!, data[i + 1]!, data[i + 2]!];

    if (dist2(rgb, bgRgb) < BG_NEAR_DIST2) return 'bg';

    const dB = dist2(rgb, baseRgb);
    const dS = dist2(rgb, strokeRgb);
    if (Math.min(dB, dS) > COLOR_FAR_DIST2) return 'bg';
    return dB < dS ? 'base' : 'stroke';
  };
}

async function buildMaskPng(
  data: Buffer,
  width: number,
  height: number,
  classify: (data: Buffer, i: number) => Klass,
  target: 'base' | 'stroke'
): Promise<Buffer> {
  // potrace 는 검정 픽셀을 추적 → target 일치는 0, 그 외는 255
  const mask = Buffer.alloc(width * height, 255);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    if (classify(data, i) === target) mask[j] = 0;
  }
  return sharp(mask, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

function extractPathDs(svgText: string): string[] {
  const re = /<path\s+d="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(svgText)) !== null) out.push(m[1]!);
  return out;
}

export async function pngToSvg(buf: Buffer, opts: PngToSvgOptions): Promise<string> {
  const baseHex = normHex(opts.baseHex);
  const strokeHex = darken(baseHex, 0.4);
  const backgroundHex = opts.backgroundHex ?? pickBackground(baseHex);

  const baseRgb = hexToRgb(baseHex);
  const strokeRgb = hexToRgb(strokeHex);
  const bgRgb = hexToRgb(backgroundHex);

  const { data, info } = await sharp(buf)
    .resize(SIZE, SIZE, { fit: 'contain', background: backgroundHex })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    throw new Error(`pngToSvg: expected RGBA, got channels=${info.channels}`);
  }

  const classify = classifyFactory(baseRgb, strokeRgb, bgRgb);

  let subjectCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (classify(data, i) !== 'bg') subjectCount++;
  }
  if (subjectCount === 0) {
    throw new Error('pngToSvg: empty subject (all pixels classified as background)');
  }

  const baseMaskPng = await buildMaskPng(data, SIZE, SIZE, classify, 'base');
  const strokeMaskPng = await buildMaskPng(data, SIZE, SIZE, classify, 'stroke');

  const traceOpts = {
    threshold: 128,
    turdSize: 4,
    optTolerance: 0.4,
    alphaMax: 1,
  };
  const baseSvg = (await traceP(baseMaskPng, traceOpts)) as string;
  const strokeSvg = (await traceP(strokeMaskPng, traceOpts)) as string;

  const baseDs = extractPathDs(baseSvg);
  const strokeDs = extractPathDs(strokeSvg);

  const fillLayer = baseDs.map((d) => `<path d="${d}"/>`).join('');
  const strokeLayer = strokeDs.map((d) => `<path d="${d}"/>`).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill-rule="evenodd">` +
    `<g data-layer="fill" fill="${baseHex}">${fillLayer}</g>` +
    `<g data-layer="stroke" fill="${strokeHex}">${strokeLayer}</g>` +
    `</svg>`
  );
}
