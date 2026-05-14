import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { darken, normHex } from '../../utils/color';

const traceP = promisify(potrace.trace);

const SIZE = 1024;

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

// 외부 LLM 의 stroke 두께가 모델마다 다름 — viewBox 픽셀 기준 목표 두께.
// 단, mixed-thickness 아이콘(굵은 outline + 얇은 디테일 혼합)에서 평범한 stroke 까지
// 깎으면 디테일(연결선, 점, 작은 요소)이 끊기거나 라운딩되어 손상됨.
// 따라서 raw 가 TARGET 의 NORMALIZE_THRESHOLD_RATIO 배 이상으로 "확실히 두꺼울 때" 만
// erosion 발동. 평범한 입력은 손 대지 않고 통과시켜 원본 품질 보존.
const TARGET_STROKE_VB = 8;
const NORMALIZE_THRESHOLD_RATIO = 2;
const NORMALIZE_THRESHOLD_VB = TARGET_STROKE_VB * NORMALIZE_THRESHOLD_RATIO;

// 4-connected morphological erosion. iterations 회 반복 = 양쪽에서 N px 씩 깎임 → 두께 2N 감소.
function erodeMask(
  mask: Uint8Array,
  width: number,
  height: number,
  iterations: number
): Uint8Array {
  let src = mask;
  for (let it = 0; it < iterations; it++) {
    const dst = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!src[i]) continue;
        const l = x > 0 ? src[i - 1] : 0;
        const r = x < width - 1 ? src[i + 1] : 0;
        const u = y > 0 ? src[i - width] : 0;
        const d = y < height - 1 ? src[i + width] : 0;
        if (l && r && u && d) dst[i] = 1;
      }
    }
    src = dst;
  }
  return src;
}

// 4-connected morphological dilation. iterations 회 반복 = 양쪽으로 N px 씩 부풀림 → 두께 2N 증가.
function dilateMask(
  mask: Uint8Array,
  width: number,
  height: number,
  iterations: number
): Uint8Array {
  let src = mask;
  for (let it = 0; it < iterations; it++) {
    const dst = new Uint8Array(width * height);
    dst.set(src); // 기존 on 픽셀 보존
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (src[i]) continue; // 이미 on
        const l = x > 0 ? src[i - 1] : 0;
        const r = x < width - 1 ? src[i + 1] : 0;
        const u = y > 0 ? src[i - width] : 0;
        const d = y < height - 1 ? src[i + width] : 0;
        if (l || r || u || d) dst[i] = 1;
      }
    }
    src = dst;
  }
  return src;
}

// bool 마스크 → potrace 가 추적할 PNG (검정=대상, 흰색=배경).
async function boolMaskToPng(
  mask: Uint8Array,
  width: number,
  height: number
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height, 255);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) buf[i] = 0;
  }
  return sharp(buf, { raw: { width, height, channels: 1 } }).png().toBuffer();
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

  // 1패스: 픽셀 분류 → base/stroke bool 마스크 + subject 존재 확인
  const baseBool = new Uint8Array(SIZE * SIZE);
  const strokeBool = new Uint8Array(SIZE * SIZE);
  let subjectCount = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const c = classify(data, i);
    if (c !== 'bg') subjectCount++;
    if (c === 'base') baseBool[j] = 1;
    else if (c === 'stroke') strokeBool[j] = 1;
  }
  if (subjectCount === 0) {
    throw new Error('pngToSvg: empty subject (all pixels classified as background)');
  }

  const thicknessRawVb = estimateThickness(strokeBool, SIZE, SIZE);

  // 보정 정책: raw 가 NORMALIZE_THRESHOLD_VB(= TARGET * 2) 보다 두꺼울 때만 erosion 발동.
  // 평범한 입력은 그대로 통과 → 얇은 디테일(연결선, 점 등) 손상 없음.
  // 얇은 stroke 의 dilation 은 mixed-thickness 아이콘에서 손해가 더 커서 비활성.
  const ops = Math.floor((thicknessRawVb - TARGET_STROKE_VB) / 2);
  let strokeBoolNorm: Uint8Array = strokeBool;
  let baseBoolNorm: Uint8Array = baseBool;
  if (ops > 0 && thicknessRawVb > NORMALIZE_THRESHOLD_VB) {
    strokeBoolNorm = erodeMask(strokeBool, SIZE, SIZE, ops);
    // base dilation 으로 inner gap 메우되, 원본 stroke 영역 안으로만 자라도록 마스킹.
    // outline 이 끊긴 곳에서 base 가 bg 로 새 나가는 것 방지.
    const baseDilated = dilateMask(baseBool, SIZE, SIZE, ops);
    baseBoolNorm = new Uint8Array(SIZE * SIZE);
    for (let i = 0; i < baseDilated.length; i++) {
      if (baseBool[i] || (baseDilated[i] && strokeBool[i])) {
        baseBoolNorm[i] = 1;
      }
    }
  }
  const thicknessVb =
    ops > 0 ? estimateThickness(strokeBoolNorm, SIZE, SIZE) : thicknessRawVb;

  // 작은 픽셀 불일치 (T-junction 교차점, antialiased fringe) 보정 — closing = dilate 1 + erode 1.
  // T-자/십자형 stroke 교차점이나 선-원 합류 지점에서 발생하는 1-2px 단위 결함만 메우고,
  // 큰 gap 은 그대로 둠. 전체 모양 유지하면서 boundary 가 cleaner 해짐.
  strokeBoolNorm = erodeMask(dilateMask(strokeBoolNorm, SIZE, SIZE, 1), SIZE, SIZE, 1);

  const [baseMaskPng, strokeMaskPng] = await Promise.all([
    boolMaskToPng(baseBoolNorm, SIZE, SIZE),
    boolMaskToPng(strokeBoolNorm, SIZE, SIZE),
  ]);

  // stroke 마스크가 두꺼울수록 turdSize 도 키워서 노이즈 polygon 제거.
  const turdStroke = Math.max(16, Math.round(thicknessVb * 0.8));
  // potrace 파라미터: alphaMax 1.3 (코너 검출 최대치 → 직각 보존),
  // optTolerance 0 (곡선 simplify 안 함 → 픽셀 경계에 최대한 충실, "스케치" 느낌 방지).
  const traceOpts = { alphaMax: 1.3, optTolerance: 0 };
  const [baseSvg, strokeSvg] = await Promise.all([
    traceP(baseMaskPng, {
      threshold: 128,
      turdSize: 16,
      ...traceOpts,
    }) as Promise<string>,
    traceP(strokeMaskPng, {
      threshold: 128,
      turdSize: turdStroke,
      ...traceOpts,
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
    `data-baseline-stroke-vb="${baseline}">` +
    `<g class="icon-fill" fill="${baseHex}">${fillLayer}</g>` +
    `<g class="icon-stroke" fill="${strokeHex}" stroke="${strokeHex}" ` +
    `stroke-width="0" stroke-linecap="round" stroke-linejoin="round">` +
    `${strokeLayer}</g>` +
    `</svg>`
  );
}
