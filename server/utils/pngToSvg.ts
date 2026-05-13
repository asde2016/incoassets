import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { darken, normHex } from '../../utils/color';

const traceP = promisify(potrace.trace);

const SIZE = 512;

// PNG는 항상 다음 고정 색상으로 생성된다고 가정 (composables/promptGuide.ts 와 일치).
//   base   #2E5BFF
//   stroke #000000
//   bg     #FFFFFF
// 사용자 커스텀 색은 출력 SVG 의 매핑 색으로만 쓰인다.
type Rgb = [number, number, number];
const PNG_BASE_RGB: Rgb = [0x2e, 0x5b, 0xff];
const PNG_STROKE_RGB: Rgb = [0x00, 0x00, 0x00];
const PNG_BG_RGB: Rgb = [0xff, 0xff, 0xff];

// 분류 임계값 (제곱 거리, RGB 공간):
//   BG_NEAR_DIST2   - 배경에서 이만큼 가까우면 무조건 배경 (anti-alias 흡수)
//   COLOR_FAR_DIST2 - base/stroke 양쪽 모두에서 이만큼 멀면 배경 (모델 노이즈 차단)
const BG_NEAR_DIST2 = 60 * 60;
const COLOR_FAR_DIST2 = 140 * 140;

export type PngToSvgOptions = {
  /** 출력 SVG 의 fill 색 (PNG 의 고정 base #2E5BFF 에 매핑). */
  baseHex: string;
  /** 출력 SVG 의 stroke 색. 미지정 시 darken(baseHex, 0.6). */
  strokeHex?: string;
};

type Klass = 'bg' | 'base' | 'stroke';

function dist2(a: Rgb, b: Rgb): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function classify(data: Buffer, i: number): Klass {
  if (data[i + 3]! < 128) return 'bg';
  const rgb: Rgb = [data[i]!, data[i + 1]!, data[i + 2]!];
  if (dist2(rgb, PNG_BG_RGB) < BG_NEAR_DIST2) return 'bg';
  const dB = dist2(rgb, PNG_BASE_RGB);
  const dS = dist2(rgb, PNG_STROKE_RGB);
  if (Math.min(dB, dS) > COLOR_FAR_DIST2) return 'bg';
  return dB < dS ? 'base' : 'stroke';
}

// 2 * area / perimeter 로 평균 stroke 두께 추정 (viewBox 좌표 = 픽셀).
function estimateThickness(mask: Uint8Array, width: number, height: number): number {
  let area = 0;
  let perimeter = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      area++;
      const l = x > 0 ? mask[i - 1] : 0;
      const r = x < width - 1 ? mask[i + 1] : 0;
      const u = y > 0 ? mask[i - width] : 0;
      const d = y < height - 1 ? mask[i + width] : 0;
      if (!l || !r || !u || !d) perimeter++;
    }
  }
  return perimeter > 0 ? (2 * area) / perimeter : 0;
}

async function buildMaskPng(
  data: Buffer,
  width: number,
  height: number,
  target: 'base' | 'stroke'
): Promise<Buffer> {
  // potrace 는 검정(0) 픽셀을 추적 → target 일치는 0, 그 외는 255
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
  const strokeHex = opts.strokeHex ? normHex(opts.strokeHex) : darken(baseHex, 0.6);

  const { data, info } = await sharp(buf)
    .resize(SIZE, SIZE, { fit: 'contain', background: '#FFFFFF' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    throw new Error(`pngToSvg: expected RGBA, got channels=${info.channels}`);
  }

  // 1패스: 픽셀 분류 + stroke bool 마스크 (두께 측정용) + subject 존재 확인
  const strokeBool = new Uint8Array(SIZE * SIZE);
  let subjectCount = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const c = classify(data, i);
    if (c !== 'bg') subjectCount++;
    if (c === 'stroke') strokeBool[j] = 1;
  }
  if (subjectCount === 0) {
    throw new Error('pngToSvg: empty subject (all pixels classified as background)');
  }

  const thicknessVb = estimateThickness(strokeBool, SIZE, SIZE);

  const [baseMaskPng, strokeMaskPng] = await Promise.all([
    buildMaskPng(data, SIZE, SIZE, 'base'),
    buildMaskPng(data, SIZE, SIZE, 'stroke'),
  ]);

  // stroke 마스크가 두꺼울수록 turdSize 도 키워서 노이즈 polygon 제거.
  const turdStroke = Math.max(16, Math.round(thicknessVb * 0.8));
  const [baseSvg, strokeSvg] = await Promise.all([
    traceP(baseMaskPng, {
      threshold: 128,
      turdSize: 16,
      optTolerance: 0.4,
      alphaMax: 1,
    }) as Promise<string>,
    traceP(strokeMaskPng, {
      threshold: 128,
      turdSize: turdStroke,
      optTolerance: 0.4,
      alphaMax: 1,
    }) as Promise<string>,
  ]);

  const baseDs = extractPathDs(baseSvg);
  const strokeDs = extractPathDs(strokeSvg);

  // stroke 레이어는 potrace 가 추적한 polygon (외곽+내곽 컨투어 한 쌍) 을 그대로 fill 로 채워
  // baseline 두께를 재현. fill="none" + 두꺼운 stroke 로 그리면 두 컨투어가 각각 stroke 되어
  // 두께가 두 배로 그려진다.
  //
  // stroke-width 는 baseline 위에 "추가" 두께. 기본 0 = baseline, +N = 양쪽 N/2 만큼 확장.
  // 줄이는 방향은 불가능 — baseline 이 하한.
  const baseline = thicknessVb.toFixed(2);

  const fillLayer = baseDs.map((d) => `<path d="${d}"/>`).join('');
  const strokeLayer = strokeDs.map((d) => `<path d="${d}"/>`).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" ` +
    `fill-rule="evenodd" ` +
    `data-baseline-stroke-512="${baseline}" ` +
    `data-baseline-stroke-vb="${baseline}">` +
    `<g class="icon-fill" fill="${baseHex}">${fillLayer}</g>` +
    `<g class="icon-stroke" fill="${strokeHex}" stroke="${strokeHex}" ` +
    `stroke-width="0" stroke-linecap="round" stroke-linejoin="round">` +
    `${strokeLayer}</g>` +
    `</svg>`
  );
}
