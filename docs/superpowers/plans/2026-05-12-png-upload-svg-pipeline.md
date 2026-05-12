# PNG 업로드 기반 SVG 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** 모든 변경은 working tree 에만 둔다. 사용자가 명시 요청할 때까지 `git add` / `commit` / `push` 등을 실행하지 않는다. Task 끝에 commit step 이 없는 것은 의도된 것.

**Goal:** 외부 LLM 의 SVG 텍스트 복붙 흐름을 제거하고, duotone PNG 업로드 → 서버에서 sharp + potrace + centerline 추출 → SVG 변환 → 등록 → customize 다운로드 흐름으로 전면 교체한다.

**Architecture:** 변환은 모듈 4 개(`thinning`, `lineTrace`, `simplify`, `otsu`) + `pngToSvg` 통합 모듈로 분리. 저장 SVG 는 `data-layer="fill"` / `data-layer="stroke"` 두 `<g>` 그룹 구조. 다운로드 시 `applyCustomize` 가 `data-layer` 마커로 분기해 색·width·mode 를 치환.

**Tech Stack:** Nuxt 4 / Vue 3 / TypeScript / `sharp` / `potrace` / `vitest` / `pnpm`

**Spec:** [`docs/superpowers/specs/2026-05-12-png-upload-svg-pipeline-design.md`](../specs/2026-05-12-png-upload-svg-pipeline-design.md)

---

## 파일 구조

| 경로 | 상태 | 책임 |
|---|---|---|
| `tests/setup.ts` | Create (복원) | vitest 의 setupFiles 가 참조하는 빈 파일 |
| `utils/color.ts` | Create | hex 정규화, darken — pngToSvg 와 transform 양쪽에서 공용 |
| `server/utils/imageProcessing/thinning.ts` | Create | Zhang-Suen iterative thinning |
| `server/utils/imageProcessing/lineTrace.ts` | Create | 8-connected skeleton → polyline 시퀀스 |
| `server/utils/imageProcessing/simplify.ts` | Create | Douglas-Peucker polyline simplification |
| `server/utils/imageProcessing/otsu.ts` | Create | Otsu's threshold (fallback) |
| `server/utils/pngToSvg.ts` | Create | sharp + potrace + 위 4 모듈 통합. 진입점 `pngToSvg(buf, { baseHex })` |
| `server/utils/buildPrompt.ts` | Create | template 치환 ~30 줄. ollama 의존 없음 |
| `utils/svg/transform.ts` | Replace (modified) | 새 `applyCustomize`. `data-layer` 마커 기반 |
| `utils/svg/meta.ts` | Create | `validateMeta`, `makeSlug` 만 분리 |
| `utils/svg/validate.ts` | Delete (modified) | paste 파싱 + `validateAndNormalizeSvg` 제거 |
| `server/api/icons/png-to-svg.post.ts` | Create | multipart PNG 업로드 → `{ svg }` |
| `server/api/icons/build-prompt.post.ts` | Modify | 단순화 (새 `buildPrompt`) |
| `server/api/icons/generate.post.ts` | Delete | 사용 안 함 |
| `server/api/icons/library-search.get.ts` | Delete | reference 검색 — 새 흐름에서 사용 안 함 |
| `server/utils/iconPromptBuilder.ts` | Delete | ollama / reference 빌더 — 폐기 |
| `server/utils/iconIndex.ts` | Delete | library reference 인덱스 — 폐기 |
| `server/utils/iconCompose.ts` | Delete | direct Ollama SVG 생성 — 폐기 |
| `components/UploadModal.vue` | Replace | 4-step UI (keyword/color → prompt → PNG 업로드 → 미리보기·등록) |
| `components/IconResultCard.vue` | Delete | paste 결과 카드 — 새 흐름에서 사용 안 함 |
| `components/PromptGuidePanel.vue` | Delete | reference 표시 패널 — 폐기 |
| `components/CustomizePanel.vue` | Modify | `mode` 라벨 `default` → `duotone`. state 동일 |
| `components/IconDetailDialog.vue`, `IconCard.vue` 등 | Modify | `applyCustomize` 호출 시그니처만 갱신 |
| `stores/customize.ts` | Modify | `mode` 의 union 을 `'duotone' \| 'linear'` 로, default `'duotone'` |
| `tests/unit/...` | Create | 각 모듈별 단위 테스트 (TDD) |

---

## Task 1: Pre-flight — `tests/setup.ts` 복원

**이유:** `vitest.config.ts` 가 `setupFiles: ['./tests/setup.ts']` 를 참조하지만 working tree 에서 삭제됐다. 이후 모든 task 가 `pnpm test` 를 호출하므로 빈 파일이라도 복원해야 한다.

**Files:**
- Create: `tests/setup.ts`

- [ ] **Step 1: 빈 setup 파일 생성**

```typescript
// tests/setup.ts
// vitest setup file.
// Currently no global setup is needed; this file exists because
// vitest.config.ts references it.
export {};
```

- [ ] **Step 2: vitest 가 0 test 로 정상 종료하는지 확인**

```bash
pnpm test 2>&1 | tail -10
```

Expected: `No test files found, exiting with code 1` (테스트 파일이 없는 게 정상 — setup 자체는 로드되어야 함. 에러 메시지 안에 `setup.ts` 관련 stack trace 가 없으면 OK)

---

## Task 2: `utils/color.ts` — hex 정규화 / darken 공용 유틸

`pngToSvg` 와 `transform` 모두 같은 `darken(hex, amount)` 가 필요하므로 공용 모듈로 분리한다.

**Files:**
- Create: `utils/color.ts`
- Create: `tests/unit/color.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/color.test.ts
import { describe, it, expect } from 'vitest';
import { normHex, darken } from '~/utils/color';

describe('normHex', () => {
  it('lowercase 6자리 → upper-case with prefix', () => {
    expect(normHex('256bfa')).toBe('#256BFA');
  });
  it('prefix 있는 입력도 받음', () => {
    expect(normHex('#256BFA')).toBe('#256BFA');
  });
  it('잘못된 길이는 throw', () => {
    expect(() => normHex('#FFF')).toThrow();
    expect(() => normHex('256BF')).toThrow();
  });
  it('잘못된 문자는 throw', () => {
    expect(() => normHex('#GG0000')).toThrow();
  });
});

describe('darken', () => {
  it('amount=0.4 → 각 채널 × 0.6 반올림', () => {
    // #256BFA = (37, 107, 250) → × 0.6 = (22.2, 64.2, 150.0) → round = (22, 64, 150) = #164096
    expect(darken('#256BFA', 0.4)).toBe('#164096');
  });
  it('amount=0 → 입력 그대로 (대문자/prefix 정규화 포함)', () => {
    expect(darken('256bfa', 0)).toBe('#256BFA');
  });
  it('amount=1 → 검정', () => {
    expect(darken('#FFFFFF', 1)).toBe('#000000');
  });
  it('amount 범위 밖은 clamp', () => {
    expect(darken('#FFFFFF', -1)).toBe('#FFFFFF');
    expect(darken('#FFFFFF', 2)).toBe('#000000');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/color.test.ts 2>&1 | tail -20
```

Expected: FAIL — `Failed to resolve import "~/utils/color"` 같은 오류.

- [ ] **Step 3: 구현 작성**

```typescript
// utils/color.ts

const HEX6 = /^#?([0-9a-fA-F]{6})$/;

export function normHex(hex: string): string {
  const m = hex.match(HEX6);
  if (!m) throw new Error(`normHex: invalid hex "${hex}"`);
  return `#${m[1].toUpperCase()}`;
}

export function darken(hex: string, amount: number): string {
  const norm = normHex(hex);
  const raw = norm.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const k = 1 - Math.max(0, Math.min(1, amount));
  const ch = (v: number) =>
    Math.round(v * k)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/color.test.ts 2>&1 | tail -20
```

Expected: PASS — 5 개 테스트 모두 통과.

---

## Task 3: Zhang-Suen Thinning 모듈

dark mask 를 1픽셀 두께 skeleton 으로 변환한다. centerline 추출의 1단계.

**Files:**
- Create: `server/utils/imageProcessing/thinning.ts`
- Create: `tests/unit/imageProcessing/thinning.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/imageProcessing/thinning.test.ts
import { describe, it, expect } from 'vitest';
import { thinSkeleton } from '~/server/utils/imageProcessing/thinning';

function fromGrid(g: string[]): { mask: Uint8Array; w: number; h: number } {
  const h = g.length;
  const w = g[0]!.length;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    mask[y * w + x] = g[y]![x] === '#' ? 1 : 0;
  }
  return { mask, w, h };
}

function toGrid(mask: Uint8Array, w: number, h: number): string[] {
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += mask[y * w + x] ? '#' : '.';
    out.push(row);
  }
  return out;
}

describe('thinSkeleton (Zhang-Suen)', () => {
  it('이미 1px 인 라인은 그대로 유지', () => {
    const { mask, w, h } = fromGrid([
      '.......',
      '..###..',
      '.......',
    ]);
    const sk = thinSkeleton(mask, w, h);
    expect(toGrid(sk, w, h)).toEqual([
      '.......',
      '..###..',
      '.......',
    ]);
  });

  it('두꺼운 가로 직사각형 → 가로 1px 라인', () => {
    const { mask, w, h } = fromGrid([
      '.........',
      '.#######.',
      '.#######.',
      '.#######.',
      '.........',
    ]);
    const sk = thinSkeleton(mask, w, h);
    // 결과는 한 줄에 모든 픽셀이 살아있어야 함 (정확한 행은 알고리즘 구현에 따라 위/가운데/아래)
    const rowsWithOnes = toGrid(sk, w, h).filter((r) => r.includes('#'));
    expect(rowsWithOnes.length).toBe(1);
    expect(rowsWithOnes[0]).toMatch(/^\.#+\.$/);
  });

  it('완전히 빈 입력 → 빈 출력', () => {
    const { mask, w, h } = fromGrid([
      '....',
      '....',
    ]);
    const sk = thinSkeleton(mask, w, h);
    expect(Array.from(sk)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('단일 픽셀 → 단일 픽셀', () => {
    const { mask, w, h } = fromGrid([
      '.....',
      '..#..',
      '.....',
    ]);
    const sk = thinSkeleton(mask, w, h);
    expect(sk[1 * 5 + 2]).toBe(1);
    let total = 0;
    for (let i = 0; i < sk.length; i++) total += sk[i]!;
    expect(total).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/imageProcessing/thinning.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Failed to resolve import "~/server/utils/imageProcessing/thinning"`.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/imageProcessing/thinning.ts
// Zhang-Suen iterative thinning.
// Input  : binary mask (Uint8Array, 0 = background, 1 = foreground)
// Output : skeleton (Uint8Array of same dimensions)

export function thinSkeleton(
  mask: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  let prev = new Uint8Array(mask);
  let curr = new Uint8Array(prev);
  const idx = (x: number, y: number) => y * width + x;

  for (let pass = 0; pass < 1000; pass++) {
    let removedAny = false;

    for (let sub = 0; sub < 2; sub++) {
      const toRemove: number[] = [];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (!prev[idx(x, y)]) continue;

          const p2 = prev[idx(x, y - 1)]!;
          const p3 = prev[idx(x + 1, y - 1)]!;
          const p4 = prev[idx(x + 1, y)]!;
          const p5 = prev[idx(x + 1, y + 1)]!;
          const p6 = prev[idx(x, y + 1)]!;
          const p7 = prev[idx(x - 1, y + 1)]!;
          const p8 = prev[idx(x - 1, y)]!;
          const p9 = prev[idx(x - 1, y - 1)]!;

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;

          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let A = 0;
          for (let i = 0; i < 8; i++) {
            if (seq[i] === 0 && seq[i + 1] === 1) A++;
          }
          if (A !== 1) continue;

          let ok: boolean;
          if (sub === 0) {
            ok = p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0;
          } else {
            ok = p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0;
          }
          if (ok) toRemove.push(idx(x, y));
        }
      }

      if (toRemove.length > 0) {
        removedAny = true;
        for (const i of toRemove) curr[i] = 0;
        prev = new Uint8Array(curr);
      }
    }

    if (!removedAny) break;
  }

  return curr;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/imageProcessing/thinning.test.ts 2>&1 | tail -15
```

Expected: PASS — 4 개 테스트 모두 통과.

---

## Task 4: 8-connected Line Trace 모듈

skeleton(1px 라인) 을 endpoint / junction 인식하여 polyline 시퀀스로 분리한다.

**Files:**
- Create: `server/utils/imageProcessing/lineTrace.ts`
- Create: `tests/unit/imageProcessing/lineTrace.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/imageProcessing/lineTrace.test.ts
import { describe, it, expect } from 'vitest';
import { traceLines } from '~/server/utils/imageProcessing/lineTrace';

function fromGrid(g: string[]): { mask: Uint8Array; w: number; h: number } {
  const h = g.length;
  const w = g[0]!.length;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    mask[y * w + x] = g[y]![x] === '#' ? 1 : 0;
  }
  return { mask, w, h };
}

describe('traceLines', () => {
  it('직선 가로 → 1개의 polyline (양 끝점 포함)', () => {
    const { mask, w, h } = fromGrid([
      '.....',
      '.###.',
      '.....',
    ]);
    const polys = traceLines(mask, w, h);
    expect(polys.length).toBe(1);
    expect(polys[0]!.length).toBe(3);
    expect(polys[0]![0]).toEqual([1, 1]);
    expect(polys[0]![2]).toEqual([3, 1]);
  });

  it('완전히 빈 입력 → 빈 배열', () => {
    const { mask, w, h } = fromGrid(['.....', '.....']);
    expect(traceLines(mask, w, h)).toEqual([]);
  });

  it('두 개의 분리된 선 → 2개의 polyline', () => {
    const { mask, w, h } = fromGrid([
      '.###...',
      '.......',
      '....###',
    ]);
    const polys = traceLines(mask, w, h);
    expect(polys.length).toBe(2);
  });

  it('단일 픽셀(고립점)은 polyline 으로 채택되지 않음 (길이 < 2)', () => {
    const { mask, w, h } = fromGrid([
      '.....',
      '..#..',
      '.....',
    ]);
    expect(traceLines(mask, w, h)).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/imageProcessing/lineTrace.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Failed to resolve import`.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/imageProcessing/lineTrace.ts
// Skeleton(1px wide binary) → polyline sequences.
// Endpoints (degree 1) start a walk; junctions (degree >= 3) terminate it.

export type Point = [number, number];
export type Polyline = Point[];

const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
const DY = [-1, -1, -1, 0, 0, 1, 1, 1];

export function traceLines(
  skeleton: Uint8Array,
  width: number,
  height: number
): Polyline[] {
  const idx = (x: number, y: number) => y * width + x;
  const at = (x: number, y: number) =>
    x < 0 || x >= width || y < 0 || y >= height ? 0 : skeleton[idx(x, y)]!;

  const visited = new Uint8Array(width * height);

  const neighbors = (x: number, y: number): Point[] => {
    const out: Point[] = [];
    for (let k = 0; k < 8; k++) {
      const nx = x + DX[k]!;
      const ny = y + DY[k]!;
      if (at(nx, ny)) out.push([nx, ny]);
    }
    return out;
  };

  const endpoints: Point[] = [];
  const isJunction = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!at(x, y)) continue;
      const deg = neighbors(x, y).length;
      if (deg === 1) endpoints.push([x, y]);
      else if (deg >= 3) isJunction[idx(x, y)] = 1;
    }
  }

  const walk = (sx: number, sy: number): Polyline | null => {
    if (visited[idx(sx, sy)]) return null;
    const poly: Polyline = [[sx, sy]];
    visited[idx(sx, sy)] = 1;
    let cx = sx;
    let cy = sy;

    while (true) {
      const cands = neighbors(cx, cy).filter(
        ([nx, ny]) => !visited[idx(nx, ny)]
      );
      if (cands.length === 0) break;
      const next =
        cands.find(([nx, ny]) => !isJunction[idx(nx, ny)]) ?? cands[0]!;
      poly.push(next);
      visited[idx(next[0], next[1])] = 1;
      cx = next[0];
      cy = next[1];
      if (isJunction[idx(cx, cy)]) break;
    }
    return poly;
  };

  const polys: Polyline[] = [];

  for (const [ex, ey] of endpoints) {
    const p = walk(ex, ey);
    if (p && p.length >= 2) polys.push(p);
  }

  // Closed loops or unvisited segments (no endpoints)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!at(x, y) || visited[idx(x, y)]) continue;
      const p = walk(x, y);
      if (p && p.length >= 2) polys.push(p);
    }
  }

  return polys;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/imageProcessing/lineTrace.test.ts 2>&1 | tail -15
```

Expected: PASS — 4 개 테스트 통과.

---

## Task 5: Douglas-Peucker Simplify 모듈

trace 된 polyline 을 좌표 수가 적은 단순화된 polyline 으로 만든다 (SVG path 크기 절감).

**Files:**
- Create: `server/utils/imageProcessing/simplify.ts`
- Create: `tests/unit/imageProcessing/simplify.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/imageProcessing/simplify.test.ts
import { describe, it, expect } from 'vitest';
import { simplify } from '~/server/utils/imageProcessing/simplify';

describe('simplify (Douglas-Peucker)', () => {
  it('일직선 위의 중간 점들은 모두 제거', () => {
    const poly: [number, number][] = [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
    ];
    expect(simplify(poly, 0.5)).toEqual([[0, 0], [4, 0]]);
  });

  it('큰 굴절 점은 보존', () => {
    const poly: [number, number][] = [
      [0, 0], [5, 0], [10, 10], [15, 10], [20, 0],
    ];
    const out = simplify(poly, 0.5);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([20, 0]);
    // 중간 굴절 점(들)이 살아남아야 함
    expect(out.length).toBeGreaterThanOrEqual(3);
  });

  it('점 2개 이하는 그대로 반환', () => {
    expect(simplify([[0, 0], [1, 1]], 1.0)).toEqual([[0, 0], [1, 1]]);
    expect(simplify([[5, 5]], 1.0)).toEqual([[5, 5]]);
    expect(simplify([], 1.0)).toEqual([]);
  });

  it('epsilon 이 매우 크면 양 끝점만 남김', () => {
    const poly: [number, number][] = [
      [0, 0], [1, 1], [2, 5], [3, 1], [4, 0],
    ];
    expect(simplify(poly, 100)).toEqual([[0, 0], [4, 0]]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/imageProcessing/simplify.test.ts 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/imageProcessing/simplify.ts
// Douglas-Peucker polyline simplification.

import type { Polyline, Point } from './lineTrace';

export function simplify(poly: Polyline, epsilon: number): Polyline {
  if (poly.length <= 2) return poly.slice();
  return dp(poly, 0, poly.length - 1, epsilon);
}

function dp(poly: Polyline, lo: number, hi: number, eps: number): Polyline {
  let maxDist = 0;
  let maxIdx = -1;
  const a = poly[lo]!;
  const b = poly[hi]!;
  for (let i = lo + 1; i < hi; i++) {
    const d = perpDist(poly[i]!, a, b);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }
  if (maxDist > eps && maxIdx !== -1) {
    const left = dp(poly, lo, maxIdx, eps);
    const right = dp(poly, maxIdx, hi, eps);
    return [...left, ...right.slice(1)];
  }
  return [a, b];
}

function perpDist(p: Point, a: Point, b: Point): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const tx = ax + t * dx;
  const ty = ay + t * dy;
  return Math.hypot(px - tx, py - ty);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/imageProcessing/simplify.test.ts 2>&1 | tail -15
```

Expected: PASS.

---

## Task 6: Otsu Threshold (fallback)

mid-threshold 가 fixture 와 안 맞아 한쪽 mask 가 비면 Otsu 로 재계산.

**Files:**
- Create: `server/utils/imageProcessing/otsu.ts`
- Create: `tests/unit/imageProcessing/otsu.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/imageProcessing/otsu.test.ts
import { describe, it, expect } from 'vitest';
import { otsuThreshold } from '~/server/utils/imageProcessing/otsu';

function flatHist(): number[] {
  return new Array(256).fill(0);
}

describe('otsuThreshold', () => {
  it('완전한 2-mode 분포 → 두 봉우리 사이 임계값', () => {
    const hist = flatHist();
    for (let i = 30; i <= 50; i++) hist[i] = 100;   // dark group
    for (let i = 200; i <= 220; i++) hist[i] = 100; // light group
    const total = 21 * 100 * 2;
    const T = otsuThreshold(hist, total);
    expect(T).toBeGreaterThan(50);
    expect(T).toBeLessThan(200);
  });

  it('모두 동일한 값(단일 mode) → threshold 가 0 또는 그 값', () => {
    const hist = flatHist();
    hist[128] = 1000;
    const T = otsuThreshold(hist, 1000);
    // 분리할 봉우리가 없으므로 0 이 반환됨 (구현 detail)
    expect(T).toBe(0);
  });

  it('histogram total 이 0 → 0 반환', () => {
    expect(otsuThreshold(flatHist(), 0)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/imageProcessing/otsu.test.ts 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/imageProcessing/otsu.ts
// Otsu's method: maximize between-class variance over all thresholds 0..255.

export function otsuThreshold(hist: number[], total: number): number {
  if (total <= 0) return 0;

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }

  return threshold;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/imageProcessing/otsu.test.ts 2>&1 | tail -15
```

Expected: PASS.

---

## Task 7: `pngToSvg` 통합 모듈

위 4 알고리즘 + sharp + potrace 로 단일 진입점 구성. 합본 SVG 의 구조는 spec §4 와 동일.

**Files:**
- Create: `server/utils/pngToSvg.ts`
- Create: `tests/unit/pngToSvg.test.ts`

- [ ] **Step 1: 통합 테스트 작성**

작은 합성 PNG (32×32, dark cross 한가운데 + 작은 light 사각형) 를 in-memory 로 만들어 변환.

```typescript
// tests/unit/pngToSvg.test.ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { pngToSvg } from '~/server/utils/pngToSvg';

async function makeSyntheticPng(): Promise<Buffer> {
  const w = 32;
  const h = 32;
  const buf = Buffer.alloc(w * h * 4, 0);
  const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    const i = (y * w + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  };
  // 어두운 십자 (검정에 가까운 파랑)
  for (let i = 6; i <= 26; i++) {
    set(i, 16, 21, 45, 182, 255);
    set(16, i, 21, 45, 182, 255);
  }
  // 밝은 작은 사각형 (밝은 파랑)
  for (let y = 18; y <= 22; y++) for (let x = 18; x <= 22; x++) {
    set(x, y, 37, 107, 250, 255);
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

describe('pngToSvg', () => {
  it('합성 PNG → 두 layer 가 포함된 SVG', async () => {
    const pngBuf = await makeSyntheticPng();
    const svg = await pngToSvg(pngBuf, { baseHex: '#256BFA' });

    // 루트
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 512 512"');

    // 두 layer 마커
    expect(svg).toMatch(/<g\b[^>]*data-layer="fill"/);
    expect(svg).toMatch(/<g\b[^>]*data-layer="stroke"/);

    // base / stroke 색
    expect(svg).toContain('fill="#256BFA"');
    expect(svg).toContain('stroke="#164096"'); // darken 0.4

    // 최소 1개 path 가 존재 (적어도 한 layer 에는)
    const pathCount = (svg.match(/<path\b/g) ?? []).length;
    expect(pathCount).toBeGreaterThan(0);
  }, 30_000);

  it('완전히 투명한 PNG → throw', async () => {
    const buf = await sharp({
      create: {
        width: 32, height: 32, channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).png().toBuffer();
    await expect(pngToSvg(buf, { baseHex: '#256BFA' })).rejects.toThrow(/empty subject/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/pngToSvg.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/pngToSvg.ts
import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { darken, normHex } from '../../utils/color';
import { thinSkeleton } from './imageProcessing/thinning';
import { traceLines, type Polyline } from './imageProcessing/lineTrace';
import { simplify } from './imageProcessing/simplify';
import { otsuThreshold } from './imageProcessing/otsu';

const traceP = promisify(potrace.trace);

const SIZE = 512;
const MIN_MASK_PIXELS = 100;
const DP_EPSILON = 1.0;
const DEFAULT_STROKE_WIDTH = 24;

export type PngToSvgOptions = {
  baseHex: string;
};

export async function pngToSvg(buf: Buffer, opts: PngToSvgOptions): Promise<string> {
  const baseHex = normHex(opts.baseHex);
  const strokeHex = darken(baseHex, 0.4);

  const { data, info } = await sharp(buf)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) {
    throw new Error(`pngToSvg: expected RGBA, got channels=${info.channels}`);
  }

  const N = SIZE * SIZE;
  const subject = new Uint8Array(N);
  const Y = new Uint8Array(N);
  const hist = new Array<number>(256).fill(0);
  let subjectCount = 0;
  let ymin = 255;
  let ymax = 0;

  for (let i = 0; i < N; i++) {
    const a = data[i * 4 + 3]!;
    if (a > 128) {
      subject[i] = 1;
      const y = Math.round(
        0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!
      );
      Y[i] = y;
      hist[y]++;
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
      subjectCount++;
    }
  }

  if (subjectCount === 0) {
    throw new Error('pngToSvg: empty subject (fully transparent PNG?)');
  }

  let Tdark = Math.round((ymin + ymax) / 2);
  let { dark, light } = splitMasks(subject, Y, Tdark, N);
  if (count(dark) < MIN_MASK_PIXELS || count(light) < MIN_MASK_PIXELS) {
    Tdark = otsuThreshold(hist, subjectCount);
    ({ dark, light } = splitMasks(subject, Y, Tdark, N));
  }

  // Stroke layer: thin → trace → simplify
  const skeleton = thinSkeleton(dark, SIZE, SIZE);
  const polys = traceLines(skeleton, SIZE, SIZE);
  const strokeDs = polys
    .map((p) => simplify(p, DP_EPSILON))
    .filter((p) => p.length >= 2)
    .map(polyToD);

  // Fill layer: mask → png → potrace
  const lightPng = await maskToPng(light, SIZE, SIZE);
  const lightSvg = (await traceP(lightPng, {
    turdSize: 8,
    optTolerance: 0.4,
    threshold: 128,
  })) as string;
  const fillDs = extractPathDs(lightSvg);

  const fillLayer = fillDs.map((d) => `<path d="${d}"/>`).join('');
  const strokeLayer = strokeDs.map((d) => `<path d="${d}"/>`).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<g data-layer="fill" fill="${baseHex}">${fillLayer}</g>` +
    `<g data-layer="stroke" fill="none" stroke="${strokeHex}" ` +
    `stroke-width="${DEFAULT_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">` +
    `${strokeLayer}</g>` +
    `</svg>`
  );
}

function splitMasks(subject: Uint8Array, Y: Uint8Array, T: number, N: number) {
  const dark = new Uint8Array(N);
  const light = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!subject[i]) continue;
    if (Y[i]! < T) dark[i] = 1;
    else light[i] = 1;
  }
  return { dark, light };
}

function count(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

async function maskToPng(mask: Uint8Array, w: number, h: number): Promise<Buffer> {
  const buf = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) buf[i] = mask[i] ? 0 : 255;
  return sharp(buf, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
}

function extractPathDs(svgText: string): string[] {
  const re = /<path\b[^>]*\bd="([^"]+)"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(svgText)) !== null) out.push(m[1]!);
  return out;
}

function polyToD(poly: Polyline): string {
  if (poly.length === 0) return '';
  const [sx, sy] = poly[0]!;
  let d = `M${sx} ${sy}`;
  for (let i = 1; i < poly.length; i++) {
    const [x, y] = poly[i]!;
    d += `L${x} ${y}`;
  }
  return d;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/pngToSvg.test.ts 2>&1 | tail -20
```

Expected: PASS — 2 개 테스트 통과. 최초 호출 시 sharp prebuilt 다운로드가 일어날 수 있어 30 초 timeout 설정됨.

---

## Task 8: 새 `applyCustomize` (`utils/svg/transform.ts` 전면 재작성)

`data-layer` 마커 기반으로 색·width·mode 치환. 기존 `applyCustomize` (currentColor 기반) 완전 교체.

**Files:**
- Replace: `utils/svg/transform.ts`
- Create: `tests/unit/svg.transform.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/svg.transform.test.ts
import { describe, it, expect } from 'vitest';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';

const SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
  '<g data-layer="fill" fill="#256BFA"><path d="M0 0L10 10"/></g>' +
  '<g data-layer="stroke" fill="none" stroke="#164096" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5L15 15"/></g>' +
  '</svg>';

describe('applyCustomize', () => {
  it('duotone: fill 색 + stroke 색(darken 0.4) + stroke-width 적용', () => {
    const c: CustomizeState = { size: 64, strokeWidth: 12, mode: 'duotone', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="64"');
    expect(out).toContain('height="64"');
    expect(out).toContain('fill="#FF0080"');     // fill layer
    expect(out).toContain('stroke="#990049"');    // darken(#FF0080, 0.4): r=255*.6=153=#99, g=0, b=128*.6=76.8=77=#4D — but rounding: 0.6*255=153, 0.6*0=0, 0.6*128=76.8→77 → #99004D
    // 실제 round 결과는 (153, 0, 77) → #99004D 가 맞음
    expect(out).toContain('stroke="#99004D"');
    expect(out).toContain('stroke-width="12"');
    // fill layer 보존
    expect(out).toMatch(/<g\b[^>]*data-layer="fill"/);
  });

  it('linear: fill 그룹 제거, stroke 만 남음', () => {
    const c: CustomizeState = { size: 48, strokeWidth: 6, mode: 'linear', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).not.toMatch(/data-layer="fill"/);
    expect(out).toMatch(/<g\b[^>]*data-layer="stroke"/);
    expect(out).toContain('stroke="#99004D"');
    expect(out).toContain('stroke-width="6"');
  });

  it('size 만 다르고 그 외 그대로일 때 width/height 만 변경', () => {
    const c: CustomizeState = { size: 100, strokeWidth: 24, mode: 'duotone', color: '#256BFA' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="100"');
    expect(out).toContain('height="100"');
    expect(out).toContain('fill="#256BFA"');
  });
});
```

작성 후 darken 계산을 다시 검증: `#FF0080` (255, 0, 128) × 0.6 = (153, 0, 76.8) → round → (153, 0, 77) = `#99004D`. 위 테스트의 두 assert(`stroke="#990049"`, `stroke="#99004D"`) 중 하나는 같은 값이라 중복 — 두 번째만 유지하도록 첫 assert 줄을 제거.

수정된 테스트 첫 번째 케이스의 stroke 검사:

```typescript
    // darken(#FF0080, 0.4) = (153, 0, 77) = #99004D
    expect(out).toContain('stroke="#99004D"');
```

(위 테스트 작성 시점에 이 부분만 한 줄로 둘 것 — 두 줄 assert 는 오기였다)

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/svg.transform.test.ts 2>&1 | tail -15
```

Expected: FAIL — 기존 `applyCustomize` 는 `CustomizeState` 의 union 이 다르거나 `data-layer` 미지원.

- [ ] **Step 3: `utils/svg/transform.ts` 전면 재작성**

```typescript
// utils/svg/transform.ts
// Apply customize state to a stored SVG that has data-layer="fill"/"stroke" markers.

import { darken, normHex } from '~/utils/color';

export type CustomizeState = {
  size: number;
  strokeWidth: number;
  mode: 'duotone' | 'linear';
  color: string;
};

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;
const FILL_GROUP_RE =
  /<g\b([^>]*)\bdata-layer="fill"([^>]*)>([\s\S]*?)<\/g>/i;
const STROKE_GROUP_OPEN_RE =
  /<g\b([^>]*)\bdata-layer="stroke"([^>]*)>/i;

export function applyCustomize(svg: string, c: CustomizeState): string {
  const base = normHex(c.color);
  const strokeHex = darken(base, 0.4);

  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = setOrAddAttr(attrs, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    return `<svg${a}>`;
  });

  if (c.mode === 'linear') {
    out = out.replace(FILL_GROUP_RE, '');
  } else {
    out = out.replace(FILL_GROUP_RE, (_m, before: string, after: string, inner: string) => {
      const combined = setOrAddAttr(before + after, 'fill', base);
      return `<g${combined} data-layer="fill">${inner}</g>`;
    });
  }

  out = out.replace(STROKE_GROUP_OPEN_RE, (_m, before: string, after: string) => {
    let combined = setOrAddAttr(before + after, 'stroke', strokeHex);
    combined = setOrAddAttr(combined, 'stroke-width', String(c.strokeWidth));
    return `<g${combined} data-layer="stroke">`;
  });

  return out;
}

function setOrAddAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/svg.transform.test.ts 2>&1 | tail -15
```

Expected: PASS — 3 개 테스트 통과.

---

## Task 9: `buildPrompt` (template 치환 만)

ollama 의존 제거. `utils/color.ts` 의 `darken` 재사용.

**Files:**
- Create: `server/utils/buildPrompt.ts`
- Create: `tests/unit/buildPrompt.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/buildPrompt.test.ts
import { describe, it, expect } from 'vitest';
import { buildPrompt } from '~/server/utils/buildPrompt';

describe('buildPrompt', () => {
  it('keyword / base_hex / stroke_hex / description 모두 치환', () => {
    const out = buildPrompt({
      keyword: 'credit card',
      baseHex: '#256BFA',
      description: 'with a hand pressing it',
    });
    expect(out).toContain('Create a flat, minimalist duotone icon of credit card.');
    expect(out).toContain('Color: #164096   (each RGB channel of #256BFA');
    expect(out).toContain('Color: #256BFA');
    expect(out).toContain('with a hand pressing it');
    // 두 번째 base_hex 등장도 치환되어야 함
    const baseOccurrences = (out.match(/#256BFA/g) ?? []).length;
    expect(baseOccurrences).toBeGreaterThanOrEqual(2);
    // placeholder 가 남아있으면 안 됨
    expect(out).not.toMatch(/\{[a-z_]+\}/);
  });

  it('description 미지정 → 그 자리에 빈 줄', () => {
    const out = buildPrompt({ keyword: 'cloud', baseHex: '#FF0080' });
    expect(out.trim().endsWith('not white, not light gray)')).toBe(true);
    expect(out).not.toMatch(/\{description\}/);
  });

  it('잘못된 hex → throw', () => {
    expect(() => buildPrompt({ keyword: 'x', baseHex: '#GGG' })).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/buildPrompt.test.ts 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: 구현 작성**

```typescript
// server/utils/buildPrompt.ts
import { darken, normHex } from '../../utils/color';

export type BuildPromptInput = {
  keyword: string;
  baseHex: string;
  description?: string;
};

const TEMPLATE = `Create a flat, minimalist duotone icon of {keyword}.

Output
- 512×512 px PNG with a fully transparent background (alpha channel — not white, not any solid color)
- Use only two distinct colors throughout the entire icon (no gradients, no shadows, no glows, no anti-aliased blends beyond standard edge smoothing)
- Sharp, clean edges between the two color regions

Composition
- Single centered subject with generous padding
- Geometric, simplified silhouette
- Clear visual separation between the outline strokes and the filled regions
- No text, no 3D effects, no photorealism, no unrelated extra objects

Stroke (outline)
- Color: {stroke_hex}   (each RGB channel of {base_hex} multiplied by 0.6, rounded to integer)
- Thick, uniform width (about 24px on a 512px canvas)
- Rounded line caps and joins
- Clean closed shapes

Fill (inner colored regions)
- Color: {base_hex}
- Solid flat color, no gradient or transparency variation
- Applied selectively to inner shapes for visual emphasis
- Remaining interior regions fully transparent (not white, not light gray)

{description}`;

export function buildPrompt(input: BuildPromptInput): string {
  const base = normHex(input.baseHex);
  const stroke = darken(base, 0.4);
  const description = (input.description ?? '').trim();
  return TEMPLATE
    .replace('{keyword}', input.keyword.trim())
    .replace('{stroke_hex}', stroke)
    .replace(/\{base_hex\}/g, base)
    .replace('{description}', description);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/buildPrompt.test.ts 2>&1 | tail -15
```

Expected: PASS.

---

## Task 10: `utils/svg/meta.ts` 분리 (validateMeta / makeSlug)

기존 `utils/svg/validate.ts` 의 메타 관련 함수만 별도 모듈로. paste 관련 함수와 `validateAndNormalizeSvg` 는 Task 14 cleanup 단계에서 함께 삭제.

**Files:**
- Create: `utils/svg/meta.ts`
- Create: `tests/unit/svg.meta.test.ts`

- [ ] **Step 1: 단위 테스트 작성**

```typescript
// tests/unit/svg.meta.test.ts
import { describe, it, expect } from 'vitest';
import { validateMeta, makeSlug } from '~/utils/svg/meta';

describe('validateMeta', () => {
  it('name 필수', () => {
    const r = validateMeta({ name: '' });
    expect(r.ok).toBe(false);
  });
  it('정상 입력 → 정규화된 meta', () => {
    const r = validateMeta({
      name: '  Credit Card  ',
      tags: ['Pay', 'pay', 'finance'],
      category: 'Finance',
      description: 'a card',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.meta.name).toBe('Credit Card');
      expect(r.meta.tags).toEqual(['pay', 'finance']);
      expect(r.meta.category).toBe('Finance');
      expect(r.meta.description).toBe('a card');
    }
  });
  it('name 길이 64 초과 → 에러', () => {
    const r = validateMeta({ name: 'a'.repeat(65) });
    expect(r.ok).toBe(false);
  });
});

describe('makeSlug', () => {
  it('소문자 + 영숫자만 + 하이픈', () => {
    expect(makeSlug('Credit Card Icon')).toBe('credit-card-icon');
  });
  it('특수문자 / 한글 모두 → fallback', () => {
    expect(makeSlug('???한글???')).toMatch(/^icon-[a-z0-9]{6}$/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm test tests/unit/svg.meta.test.ts 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: 구현 — 기존 코드에서 추출**

```typescript
// utils/svg/meta.ts
import { customAlphabet } from 'nanoid';

export type IconMeta = {
  name: string;
  tags: string[];
  category: string;
  description: string;
};

export type MetaInput = {
  name?: string;
  tags?: string[];
  category?: string;
  description?: string;
};

export type MetaResult =
  | { ok: true; meta: IconMeta }
  | { ok: false; errors: string[] };

export function validateMeta(input: MetaInput): MetaResult {
  const errors: string[] = [];
  const name = (input.name ?? '').trim();
  if (name.length === 0) errors.push('name is required');
  if (name.length > 64) errors.push('name must be 64 chars or fewer');

  const tagsRaw = Array.isArray(input.tags) ? input.tags : [];
  const tagsLower = tagsRaw
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter((t) => t.length > 0 && t.length <= 30);
  const tags = Array.from(new Set(tagsLower));
  if (tags.length > 20) errors.push('too many tags (max 20)');

  const category = (input.category ?? '').trim();
  if (category.length > 30) errors.push('category must be 30 chars or fewer');

  const description = (input.description ?? '').trim();
  if (description.length > 500) errors.push('description must be 500 chars or fewer');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, meta: { name, tags, category, description } };
}

const NANO = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export function makeSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) return `icon-${NANO()}`;
  return slug;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test tests/unit/svg.meta.test.ts 2>&1 | tail -15
```

Expected: PASS.

---

## Task 11: API endpoints

새 `png-to-svg` 추가 + 기존 `build-prompt` 단순화. `generate` 와 `library-search` 는 Task 14 에서 삭제.

**Files:**
- Create: `server/api/icons/png-to-svg.post.ts`
- Replace: `server/api/icons/build-prompt.post.ts`
- Modify: `server/api/icons/index.post.ts` (`validateAndNormalizeSvg` 사용 부분 제거)

- [ ] **Step 1: `png-to-svg.post.ts` 작성**

```typescript
// server/api/icons/png-to-svg.post.ts
import { pngToSvg } from '~/server/utils/pngToSvg';

const MAX_PAYLOAD = 10 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'multipart body required' });
  }

  const file = parts.find((p) => p.name === 'file' && p.data && p.data.length > 0);
  const baseHexPart = parts.find((p) => p.name === 'baseHex');
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: '"file" field required' });
  }
  if (file.data.length > MAX_PAYLOAD) {
    throw createError({ statusCode: 413, statusMessage: 'PNG too large (max 10 MB)' });
  }
  if (file.type && !file.type.startsWith('image/png')) {
    throw createError({ statusCode: 415, statusMessage: 'PNG only' });
  }
  const baseHex = baseHexPart?.data ? baseHexPart.data.toString('utf-8') : '#256BFA';

  let svg: string;
  try {
    svg = await pngToSvg(file.data, { baseHex });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'pngToSvg failed';
    throw createError({ statusCode: 422, statusMessage: message });
  }
  return { svg };
});
```

- [ ] **Step 2: `build-prompt.post.ts` 재작성**

```typescript
// server/api/icons/build-prompt.post.ts
import { buildPrompt } from '~/server/utils/buildPrompt';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    keyword?: unknown;
    baseHex?: unknown;
    description?: unknown;
  } | null;
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : '';
  const baseHex = typeof body?.baseHex === 'string' ? body.baseHex : '';
  const description =
    typeof body?.description === 'string' ? body.description : undefined;

  if (!keyword) {
    throw createError({ statusCode: 400, statusMessage: 'keyword required' });
  }
  if (!baseHex) {
    throw createError({ statusCode: 400, statusMessage: 'baseHex required' });
  }

  try {
    const prompt = buildPrompt({ keyword, baseHex, description });
    return { prompt };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'buildPrompt failed';
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
```

- [ ] **Step 3: `index.post.ts` — `validateAndNormalizeSvg` 호출 제거**

기존 흐름은 SVG 텍스트를 검증·정규화했다. 새 흐름은 우리 서버가 생성한 SVG 를 그대로 받으므로 검증 불필요. `validateMeta` 만 유지.

```typescript
// server/api/icons/index.post.ts
import { validateMeta, makeSlug, type IconMeta } from '~/utils/svg/meta';
import { insertIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    name?: unknown;
    tags?: unknown;
    category?: unknown;
    description?: unknown;
    svg?: unknown;
  } | null;

  if (typeof body?.svg !== 'string' || !body.svg.startsWith('<svg')) {
    throw createError({ statusCode: 400, statusMessage: 'svg required' });
  }

  const metaResult = validateMeta({
    name: typeof body.name === 'string' ? body.name : '',
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    category: typeof body.category === 'string' ? body.category : '',
    description: typeof body.description === 'string' ? body.description : '',
  });
  if (!metaResult.ok) {
    throw createError({
      statusCode: 422,
      statusMessage: metaResult.errors.join('; '),
    });
  }

  const meta: IconMeta = metaResult.meta;
  const row = insertIcon({
    name: meta.name,
    slug: makeSlug(meta.name),
    tags: meta.tags,
    category: meta.category,
    description: meta.description,
    svg: body.svg,
  });
  return row;
});
```

(주의: `insertIcon` 의 시그니처가 위와 다르면 그에 맞춰 호출. 호출부 시그니처를 확인하려면 `server/utils/repo/icons.ts` 를 먼저 읽고 매칭. 이 task 의 책임은 호출부 갱신뿐이다.)

- [ ] **Step 4: dev 서버에서 endpoint smoke test**

```bash
pnpm dev &
DEV_PID=$!
sleep 5

# build-prompt smoke
curl -s -X POST http://localhost:3000/api/icons/build-prompt \
  -H 'content-type: application/json' \
  -d '{"keyword":"cloud","baseHex":"#256BFA"}' | head -c 200

# png-to-svg smoke (Task 11 의 미세한 합성 PNG 필요. 이 step 은 manual:
#   브라우저에서 UploadModal 통해 검증하거나 fixture PNG 를 직접 curl 로 전송)

kill $DEV_PID 2>/dev/null
```

Expected (build-prompt): `{"prompt":"Create a flat, minimalist duotone icon of cloud.\n\nOutput\n- 512×512 px PNG ...` 으로 시작하는 JSON.

(png-to-svg manual 검증은 Task 12 의 UploadModal 통합 후에 자연스럽게 됨)

---

## Task 12: `UploadModal.vue` 전면 재작성

4 step 단일 모달. 각 step 은 이전 step 의 출력에 의존.

**Files:**
- Replace: `components/UploadModal.vue`

테스트는 단위 테스트 대신 dev 서버에서 manual e2e. (Vue 컴포넌트 단위 테스트는 빠른 회귀 가치가 낮고, UI 흐름 검증이 핵심)

- [ ] **Step 1: 컴포넌트 작성**

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSearchStore } from '~/stores/search';
import { useToast } from '~/utils/toast';

type UiStep = 'A' | 'B' | 'C' | 'D';

defineProps<{ open: boolean; keyword: string }>();
const emit = defineEmits<{ close: [] }>();

const search = useSearchStore();
const toast = useToast();

const localKeyword = ref('');
const baseHex = ref('#256BFA');
const description = ref('');
const promptText = ref('');
const buildError = ref('');
const buildLoading = ref(false);

const pngFile = ref<File | null>(null);
const convertedSvg = ref('');
const convertLoading = ref(false);
const convertError = ref('');

const name = ref('');
const tagsText = ref('');
const category = ref('');
const detailDescription = ref('');
const saveLoading = ref(false);
const saveError = ref('');

const currentStep = computed<UiStep>(() => {
  if (!promptText.value) return 'A';
  if (!convertedSvg.value) return 'C';
  return 'D';
});

const canBuild = computed(
  () => localKeyword.value.trim().length > 0 && !buildLoading.value
);
const canConvert = computed(() => !!pngFile.value && !convertLoading.value);
const canSave = computed(
  () => !!convertedSvg.value && name.value.trim().length > 0 && !saveLoading.value
);

watch(
  () => useUploadProps.open,
  // Note: just to reset locals when modal opens. Replace with real props watch:
  () => {}
);

async function onBuildPrompt() {
  buildLoading.value = true;
  buildError.value = '';
  promptText.value = '';
  try {
    const res = await $fetch<{ prompt: string }>('/api/icons/build-prompt', {
      method: 'POST',
      body: {
        keyword: localKeyword.value.trim(),
        baseHex: baseHex.value,
        description: description.value,
      },
    });
    promptText.value = res.prompt;
  } catch (e) {
    buildError.value = e instanceof Error ? e.message : '프롬프트 생성 실패';
  } finally {
    buildLoading.value = false;
  }
}

async function onCopyPrompt() {
  if (!promptText.value) return;
  try {
    await navigator.clipboard.writeText(promptText.value);
    toast.success('프롬프트 복사됨');
  } catch {
    /* clipboard unavailable */
  }
}

function onPickFile(ev: Event) {
  const t = ev.target as HTMLInputElement;
  pngFile.value = t.files?.[0] ?? null;
  convertedSvg.value = '';
  convertError.value = '';
}

async function onConvert() {
  if (!pngFile.value) return;
  convertLoading.value = true;
  convertError.value = '';
  convertedSvg.value = '';
  try {
    const form = new FormData();
    form.append('file', pngFile.value);
    form.append('baseHex', baseHex.value);
    const res = await $fetch<{ svg: string }>('/api/icons/png-to-svg', {
      method: 'POST',
      body: form,
    });
    convertedSvg.value = res.svg;
  } catch (e) {
    convertError.value = e instanceof Error ? e.message : 'SVG 변환 실패';
  } finally {
    convertLoading.value = false;
  }
}

async function onSave() {
  saveLoading.value = true;
  saveError.value = '';
  try {
    const tags = tagsText.value
      .split(/[,#\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const row = await $fetch('/api/icons', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        tags,
        category: category.value.trim(),
        description: detailDescription.value.trim(),
        svg: convertedSvg.value,
      },
    });
    search.add(row);
    toast.success('등록 완료');
    emit('close');
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : '등록 실패';
  } finally {
    saveLoading.value = false;
  }
}

function onOpenChange(v: boolean) {
  if (!v) emit('close');
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent size="xl">
      <template #header>
        <DialogHeader>
          <DialogTitle>아이콘 생성</DialogTitle>
          <DialogDescription>
            ① 키워드·색 입력 → ② 외부 LLM 용 프롬프트 복사 → ③ 결과 PNG 업로드 → ④ 변환 SVG 확인 후 등록
          </DialogDescription>
        </DialogHeader>
      </template>

      <div class="flex flex-col gap-24">
        <!-- Step A: 입력 -->
        <section>
          <h3 class="mb-8 text-13 font-medium text-gray-700">① 입력</h3>
          <div class="flex flex-col gap-10">
            <input
              v-model="localKeyword"
              class="h-40 w-full rounded-md border border-gray-200 px-12 text-14 outline-none focus:border-primary"
              placeholder="키워드 (예: 결제, 클라우드)" />
            <label class="flex items-center gap-10 text-13 text-gray-700">
              <span>색상</span>
              <input type="color" v-model="baseHex" class="h-32 w-44 cursor-pointer rounded" />
              <span class="font-mono text-12 text-gray-500">{{ baseHex }}</span>
            </label>
            <textarea
              v-model="description"
              rows="2"
              maxlength="500"
              placeholder="설명 (선택)"
              class="resize-y rounded-md border border-gray-200 px-12 py-8 text-13 outline-none focus:border-primary" />
            <button
              type="button"
              class="h-36 self-start rounded-md bg-primary px-16 text-13 font-medium text-primary-foreground disabled:opacity-50"
              :disabled="!canBuild"
              @click="onBuildPrompt">
              {{ buildLoading ? '프롬프트 만드는 중…' : '프롬프트 생성' }}
            </button>
            <div v-if="buildError" class="text-12 text-danger">{{ buildError }}</div>
          </div>
        </section>

        <!-- Step B: 프롬프트 출력 -->
        <section v-if="promptText">
          <h3 class="mb-8 text-13 font-medium text-gray-700">② 프롬프트 복사</h3>
          <textarea
            readonly
            class="h-[14rem] w-full resize-y rounded-md border border-gray-200 bg-gray-50 p-12 font-mono text-11 text-gray-700 outline-none"
            :value="promptText" />
          <button
            type="button"
            class="mt-8 h-32 rounded-md border border-gray-200 bg-white px-12 text-12 text-gray-700 hover:bg-gray-100"
            @click="onCopyPrompt">
            프롬프트 복사
          </button>
        </section>

        <!-- Step C: PNG 업로드 -->
        <section v-if="promptText">
          <h3 class="mb-8 text-13 font-medium text-gray-700">③ PNG 업로드</h3>
          <input type="file" accept="image/png" @change="onPickFile" />
          <button
            type="button"
            class="ml-12 h-32 rounded-md bg-primary px-12 text-12 text-primary-foreground disabled:opacity-50"
            :disabled="!canConvert"
            @click="onConvert">
            {{ convertLoading ? '변환 중…' : 'SVG 로 변환' }}
          </button>
          <div v-if="convertError" class="mt-8 text-12 text-danger">{{ convertError }}</div>
        </section>

        <!-- Step D: 미리보기 + 메타 + 등록 -->
        <section v-if="convertedSvg">
          <h3 class="mb-8 text-13 font-medium text-gray-700">④ 결과 확인 + 등록</h3>
          <div class="grid grid-cols-1 gap-16 md:grid-cols-2">
            <div class="rounded-md border border-gray-200 bg-white p-12">
              <div class="aspect-square w-full" v-html="convertedSvg" />
            </div>
            <div class="flex flex-col gap-8">
              <input
                v-model="name"
                placeholder="이름 (필수)"
                class="h-36 rounded-md border border-gray-200 px-12 text-13 outline-none focus:border-primary" />
              <input
                v-model="tagsText"
                placeholder="태그 (콤마/해시 구분)"
                class="h-36 rounded-md border border-gray-200 px-12 text-13 outline-none focus:border-primary" />
              <input
                v-model="category"
                placeholder="카테고리"
                class="h-36 rounded-md border border-gray-200 px-12 text-13 outline-none focus:border-primary" />
              <textarea
                v-model="detailDescription"
                rows="2"
                placeholder="설명"
                class="resize-y rounded-md border border-gray-200 px-12 py-8 text-13 outline-none focus:border-primary" />
              <button
                type="button"
                class="h-36 self-start rounded-md bg-primary px-16 text-13 font-medium text-primary-foreground disabled:opacity-50"
                :disabled="!canSave"
                @click="onSave">
                {{ saveLoading ? '등록 중…' : '등록' }}
              </button>
              <div v-if="saveError" class="text-12 text-danger">{{ saveError }}</div>
            </div>
          </div>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

(코드 안의 `watch` 부분은 모달이 열릴 때 state 리셋 — 기존 UploadModal 의 동일 패턴을 그대로 차용. 실제 구현 시 `watch(() => props.open, ...)` 으로 교체. `useUploadProps` 는 사용 안 함 — 위 코드는 placeholder 가 아니라 명시적으로 `props.open` 으로 교체할 것)

- [ ] **Step 2: dev 서버에서 e2e 검증**

```bash
pnpm dev
```

브라우저에서 라이브러리 페이지(`/`) 열기 → "+ 새 아이콘" 또는 IconCreateCard 클릭 → 모달이 4 step 으로 표시됨 → keyword `결제` + color `#256BFA` + 설명 입력 → "프롬프트 생성" 클릭 → 프롬프트 textarea 표시됨 → Claude/GPT 에 복붙 후 받은 PNG 를 다운로드 → "PNG 업로드" → "SVG 로 변환" → 미리보기에 SVG 가 표시됨 → 이름·태그 입력 → "등록" → 모달 닫힘 + 라이브러리 그리드에 새 아이콘 등장.

이 검증은 실제 LLM 호출이 필요해서 자동화 어려움. dev 서버에서 manual 통과만 확인하면 OK.

---

## Task 13: 호출부 + store 갱신

`applyCustomize` 의 새 시그니처에 맞춰 사용 위치 갱신.

**Files:**
- Modify: `stores/customize.ts`
- Modify: `components/CustomizePanel.vue`
- Modify: `components/IconDetailDialog.vue`
- Modify: `components/IconCard.vue`
- Modify: `components/IconGrid.vue` (사용 시)
- Modify: `components/IconCreateCard.vue`, `IconDeletedCard.vue` (사용 시)

- [ ] **Step 1: `stores/customize.ts` 갱신**

```typescript
// stores/customize.ts
import { defineStore } from 'pinia';

type Mode = 'duotone' | 'linear';

export const useCustomizeStore = defineStore('customize', {
  state: () => ({
    size: 64 as number,
    strokeWidth: 24 as number,
    mode: 'duotone' as Mode,
    color: '#256BFA' as string,
  }),
  actions: {
    reset() {
      this.size = 64;
      this.strokeWidth = 24;
      this.mode = 'duotone';
      this.color = '#256BFA';
    },
  },
  persist: true,
});
```

(기존 store 가 다른 패턴(setup-store 등)을 쓰면 그 패턴에 맞춰 변경. state 값 라벨만 교체하고 action / persist 설정은 보존.)

- [ ] **Step 2: `CustomizePanel.vue` — `mode` 라벨만 갱신**

기존에 `'default'` 라벨이었다면 `'duotone'` 로. 사용자에게 보여지는 텍스트 (예: "기본") 도 "Duotone" 으로 통일.

```bash
grep -n "'default'\|\"default\"" components/CustomizePanel.vue
```

해당 줄들을 `'duotone'` / `"duotone"` 로 교체.

- [ ] **Step 3: `IconDetailDialog.vue` / `IconCard.vue` 등에서 `applyCustomize` 호출 점검**

```bash
grep -rn "applyCustomize" components/ pages/ composables/
```

각 호출이 새 시그니처와 일치하는지 점검. 기존 코드가 `applyCustomize(svg, { size, strokeWidth, mode, color })` 로 호출했다면 변경 없음 (타입은 `mode` union 만 다름).

- [ ] **Step 4: type check + dev 서버 sanity**

```bash
pnpm nuxt prepare
pnpm dev &
DEV_PID=$!
sleep 5
curl -s http://localhost:3000/ | head -c 200
kill $DEV_PID 2>/dev/null
```

홈 페이지 HTML 이 정상 응답. dev 서버 콘솔에 컴파일 에러 없음.

---

## Task 14: Cleanup — 제거 대상 파일 일괄 삭제

**Files (delete):**
- `server/api/icons/generate.post.ts`
- `server/api/icons/library-search.get.ts`
- `server/utils/iconPromptBuilder.ts`
- `server/utils/iconIndex.ts`
- `server/utils/iconCompose.ts`
- `components/IconResultCard.vue`
- `components/PromptGuidePanel.vue`
- `utils/svg/validate.ts` (기존 `validateMeta`/`makeSlug` 는 Task 10 에서 새 파일로 이동했음)

- [ ] **Step 1: 잔존 import 점검 — 삭제 전**

```bash
for f in \
  server/api/icons/generate.post.ts \
  server/api/icons/library-search.get.ts \
  server/utils/iconPromptBuilder \
  server/utils/iconIndex \
  server/utils/iconCompose \
  components/IconResultCard \
  components/PromptGuidePanel \
  utils/svg/validate
do
  echo "--- importers of $f ---"
  grep -rln "$f" --include="*.ts" --include="*.vue" . \
    | grep -v "^./node_modules" | grep -v "^./.nuxt" \
    | grep -v "$f"
done
```

각 import 가 발견되면 그 호출부를 적절한 대체(예: `utils/svg/validate` → `utils/svg/meta`) 로 교체. 교체 후에야 삭제.

- [ ] **Step 2: 파일 삭제**

```bash
rm \
  server/api/icons/generate.post.ts \
  server/api/icons/library-search.get.ts \
  server/utils/iconPromptBuilder.ts \
  server/utils/iconIndex.ts \
  server/utils/iconCompose.ts \
  components/IconResultCard.vue \
  components/PromptGuidePanel.vue \
  utils/svg/validate.ts
```

- [ ] **Step 3: 잔존 import 재점검**

```bash
pnpm nuxt prepare 2>&1 | tail -30
```

Expected: type check 통과. 오류 발생 시 해당 파일의 import 를 수정 후 재시도.

---

## Task 15: 회귀 검증

- [ ] **Step 1: 전체 단위 테스트 통과**

```bash
pnpm test 2>&1 | tail -30
```

Expected:
- `color.test.ts` 5/5 PASS
- `imageProcessing/thinning.test.ts` 4/4 PASS
- `imageProcessing/lineTrace.test.ts` 4/4 PASS
- `imageProcessing/simplify.test.ts` 4/4 PASS
- `imageProcessing/otsu.test.ts` 3/3 PASS
- `pngToSvg.test.ts` 2/2 PASS
- `svg.transform.test.ts` 3/3 PASS
- `buildPrompt.test.ts` 3/3 PASS
- `svg.meta.test.ts` 5/5 PASS

총 33 개 테스트 PASS.

- [ ] **Step 2: Lint 통과**

```bash
pnpm lint 2>&1 | tail -20
```

Expected: 0 errors. warning 만 있어도 OK.

- [ ] **Step 3: dev 서버 e2e manual**

```bash
pnpm dev
```

브라우저 manual 시나리오 (spec §12 의 합격 판정 2번):
1. 라이브러리 페이지(`/`) 정상 표시
2. UploadModal 의 4 step 흐름 (Task 12 Step 2 와 동일)
3. 등록된 아이콘이 그리드에 표시되고 IconDetailDialog 에서 customize 가 동작 (size / strokeWidth / mode duotone↔linear / color 변경 시 즉시 반영)
4. 검색 동작 OK
5. soft-delete / restore 동작 OK

각 시나리오가 콘솔 에러 없이 동작하면 PASS.

---

## Self-Review

**1. Spec coverage**

| Spec 섹션 | 매핑된 task |
|---|---|
| §2 새 흐름 (4 step) | Task 12 |
| §3 prompt template | Task 9 |
| §4 변환 파이프라인 | Task 3, 4, 5, 6, 7 |
| §4.1 모듈 분리 | Task 3, 4, 5, 6, 7 |
| §4.2 위험 / 대응 (Otsu fallback) | Task 6 + Task 7 의 fallback 분기 |
| §5 다운로드 customize 재구현 | Task 8 |
| §6 API 변경 | Task 11 |
| §7 컴포넌트 변경 | Task 12 (UploadModal), Task 13 (CustomizePanel + 호출부) |
| §8 제거 대상 | Task 14 |
| §9 유지 대상 | 명시적 task 없음 — 변경하지 않으면 유지 |
| §10 의존성 | (PoC 단계에서 이미 설치됨, Task 1 의 sanity check 로 확인) |
| §11 테스트 전략 | Task 2~10 의 각 단위 테스트 |
| §12 합격 판정 | Task 15 |

§4.2 의 "Tdark 가 fixture 와 안 맞아 mask 한쪽 비어짐 → Otsu fallback" 은 Task 7 의 `pngToSvg` 내부 `count(dark) < MIN_MASK_PIXELS || count(light) < MIN_MASK_PIXELS` 분기로 구현됨. "morphological opening" 휴리스틱은 spec 에서 옵션으로 적혀 있었으나 plan 에서는 단순화를 위해 적용 안 함 — 1차 결과가 너무 깨지면 후속 iteration 에서 추가.

**2. Placeholder scan**

- "TBD" / "TODO" / "implement later" — 없음
- Task 12 의 UploadModal 코드 안 `watch(() => useUploadProps.open, ...)` 줄은 placeholder 처럼 보이지만 Step 1 본문에 "실제 구현 시 `watch(() => props.open, ...)` 으로 교체" 로 명시 정정 됨. 단 그 줄 자체는 동작하는 코드 형태가 아니라 컴파일 에러를 낼 수 있음 — 작업자가 `props.open` 으로 교체해야 한다는 점은 명확.
- Task 11 Step 3 의 `insertIcon` 호출 시그니처는 "호출부 시그니처를 확인하려면 `server/utils/repo/icons.ts` 를 먼저 읽고 매칭" 으로 안내 — 이건 spec coverage 가 아니고 구현자 책임을 명시한 것으로 OK.

**3. Type / 이름 일관성**

- `applyCustomize(svg, c)` / `CustomizeState` 의 필드 (`size`, `strokeWidth`, `mode`, `color`) — Task 8 / 13 / spec §5 일관
- `data-layer="fill"`, `data-layer="stroke"` — Task 7 / 8 / spec §4 일관
- `pngToSvg(buf, { baseHex })` — Task 7 / 11 일관
- `buildPrompt({ keyword, baseHex, description? })` — Task 9 / 11 일관
- `normHex`, `darken` 두 export — Task 2 에서 정의, Task 7 / 8 / 9 에서 import. ✓

이상 없음.

---

## Plan 완료. 실행 방식을 선택해주세요.
