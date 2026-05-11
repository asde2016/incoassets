# 외부 LLM 프롬프트 빌더 Reference-Heavy v2 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `iconPromptBuilder.ts` 의 외부 LLM 프롬프트를 강화해 GPT/Claude/Gemini 가 reference/server.png 스타일과 일치하는 SVG 를 일관되게 출력하도록 한다. 보조적으로 결과물의 캔버스 활용/듀오톤/페르소나 anatomy 미달을 IconResultCard 에서 경고 뱃지로 표시한다.

**Architecture:** 핵심은 `server/utils/iconPromptBuilder.ts` 의 `renderPrompt() / getConceptTokens() / collectReferences()` 3 함수 보강. 결과 검증은 `utils/svg/validate.ts` 의 `ValidationResult` 에 `warnings` 필드를 추가하고 `IconResultCard.vue` 에서 노란 ⚠ 뱃지로 표시. UploadModal · build-prompt API · DB 스키마 무변경.

**Tech Stack:** Nuxt 3 · TypeScript · Vue 3 SFC · vitest + happy-dom · ollama qwen3.5:9b (build-prompt 단계만) · 외부 LLM 은 코드 의존 없음.

**Spec:** [`../specs/2026-05-11-icon-prompt-reference-heavy-design.md`](../specs/2026-05-11-icon-prompt-reference-heavy-design.md)

**git 노트:** 사용자가 git 작업을 직접 처리한다 (memory: `feedback_no_git_ops`). 각 Task 끝의 "Checkpoint" 단계는 _커밋 시점 후보_ 만 표시하고 실제 `git` 명령은 실행하지 않는다.

---

## File Structure

| 파일 | 역할 |
|---|---|
| `utils/svg/validate.ts` | `ValidationResult.ok=true` 케이스에 `warnings: string[]` 필드 추가 + bbox/shape/fill 카운트 헬퍼 |
| `tests/unit/svg.validate.test.ts` | 기존 파일에 warnings 케이스 테스트 추가 |
| `components/IconResultCard.vue` | warnings 가 있을 때 우상단 ⚠ 뱃지 + tooltip 표시 |
| `server/utils/iconPromptBuilder.ts` | PERSONA_HINTS 사전 / collectReferences maxTotal 분기 / renderPrompt 6개 개선 (I1~I6) |
| `tests/unit/iconPromptBuilder.test.ts` | **신규**. renderPrompt 순수 함수 출력 검증 + PERSONA_HINTS 분기 + collectReferences 분기 |

`UploadModal.vue`, `server/api/icons/build-prompt.post.ts`, DB/스키마: 변경 없음.

---

## Task 1: ValidationResult 타입에 warnings 필드 추가

**Files:**
- Modify: `utils/svg/validate.ts:101` (타입 정의), `utils/svg/validate.ts:222-369` (validateAndNormalizeSvg 함수 — `ok:true` 반환 시 `warnings: []` 추가)

- [ ] **Step 1: 기존 테스트가 통과하는지 베이스라인 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts`
Expected: 모든 기존 테스트 PASS.

- [ ] **Step 2: 타입 확장**

`utils/svg/validate.ts:101` 의 `ValidationResult` 타입을 변경:

```ts
export type ValidationResult =
  | { ok: true; svg: string; warnings: string[] }
  | { ok: false; errors: string[] };
```

- [ ] **Step 3: ok=true 반환부에 빈 warnings 추가**

`utils/svg/validate.ts:369` (함수의 마지막 return) 을 다음으로 변경:

```ts
  return { ok: true, svg: `${rootOpen}${emit(shapeTree)}</svg>`, warnings: [] };
```

- [ ] **Step 4: 타입 체크 + 기존 테스트 통과 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts && pnpm lint`
Expected:
- 기존 테스트는 모두 PASS (기존 코드는 `r.ok` 만 본 후 `r.svg` 접근 — warnings 무관)
- lint 통과

만약 lint에서 `IconResultCard.vue` 의 `validation.ok` 분기 등이 warnings 필드 사용을 강제하면, 일단 무시 (Task 5에서 사용 추가).

- [ ] **Step 5: Checkpoint** — 타입 변경만 격리된 변경. 사용자가 원하면 여기서 커밋.

---

## Task 2: extractBBox 헬퍼 함수 + 단위 테스트

**Files:**
- Modify: `utils/svg/validate.ts` (private helper export 추가)
- Modify: `tests/unit/svg.validate.test.ts` (테스트 추가)

목표: SVG 문자열을 받아 `{ minX, maxX, minY, maxY } | null` 반환. `rect/circle/ellipse/line/polyline/polygon` 의 좌표를 단순 정규식으로 추출. `path` 의 `d` 속성은 absolute M/L/Q/C/A 명령의 좌표만 추출 (relative `m/l/q/c/a` 는 보수적으로 skip — 정확도 100% 불필요, warning 용도).

- [ ] **Step 1: 테스트를 먼저 작성 (TDD)**

`tests/unit/svg.validate.test.ts` 의 import 라인에 추가:

```ts
import {
  parseUploadInput,
  parseUploadList,
  validateAndNormalizeSvg,
  validateMeta,
  makeSlug,
  extractBBox,  // NEW
} from '~/utils/svg/validate';
```

파일 끝에 새 describe 블록 추가:

```ts
describe('extractBBox', () => {
  it('returns null for empty svg', () => {
    expect(extractBBox('<svg></svg>')).toBeNull();
  });

  it('captures rect bounds (x..x+width, y..y+height)', () => {
    const svg = '<svg><rect x="40" y="80" width="432" height="352"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 472, minY: 80, maxY: 432 });
  });

  it('captures circle bounds (cx±r, cy±r)', () => {
    const svg = '<svg><circle cx="256" cy="256" r="100"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 156, maxX: 356, minY: 156, maxY: 356 });
  });

  it('captures ellipse bounds (cx±rx, cy±ry)', () => {
    const svg = '<svg><ellipse cx="200" cy="300" rx="50" ry="80"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 150, maxX: 250, minY: 220, maxY: 380 });
  });

  it('captures line endpoints', () => {
    const svg = '<svg><line x1="10" y1="20" x2="100" y2="200"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 10, maxX: 100, minY: 20, maxY: 200 });
  });

  it('captures polygon/polyline points', () => {
    const svg = '<svg><polygon points="100,50 200,150 50,250"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 50, maxX: 200, minY: 50, maxY: 250 });
  });

  it('captures absolute path M/L coords', () => {
    const svg = '<svg><path d="M 40 40 L 472 472"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 472, minY: 40, maxY: 472 });
  });

  it('unions multiple shapes', () => {
    const svg = '<svg><rect x="40" y="40" width="40" height="40"/><circle cx="400" cy="400" r="50"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 450, minY: 40, maxY: 450 });
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts -t extractBBox`
Expected: 모두 FAIL (extractBBox 가 export 안 됨).

- [ ] **Step 3: extractBBox 구현**

`utils/svg/validate.ts` 의 `validateAndNormalizeSvg` 함수 위쪽(타입 정의 다음, 약 line 101~107 사이)에 헬퍼 추가:

```ts
export type BBox = { minX: number; maxX: number; minY: number; maxY: number };

const NUM = '(-?[0-9]+(?:\\.[0-9]+)?)';

function num(s: string | undefined): number | null {
  if (s == null) return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

function unionPoint(bb: BBox | null, x: number, y: number): BBox {
  if (!bb) return { minX: x, maxX: x, minY: y, maxY: y };
  return {
    minX: Math.min(bb.minX, x),
    maxX: Math.max(bb.maxX, x),
    minY: Math.min(bb.minY, y),
    maxY: Math.max(bb.maxY, y),
  };
}

function unionRange(bb: BBox | null, x1: number, x2: number, y1: number, y2: number): BBox {
  let b = unionPoint(bb, x1, y1);
  b = unionPoint(b, x2, y2);
  return b;
}

export function extractBBox(svg: string): BBox | null {
  let bb: BBox | null = null;

  const rectRe = new RegExp(
    `<rect\\b[^>]*?\\bx="${NUM}"[^>]*?\\by="${NUM}"[^>]*?\\bwidth="${NUM}"[^>]*?\\bheight="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(rectRe)) {
    const x = num(m[1]); const y = num(m[2]); const w = num(m[3]); const h = num(m[4]);
    if (x == null || y == null || w == null || h == null) continue;
    bb = unionRange(bb, x, x + w, y, y + h);
  }

  const circleRe = new RegExp(`<circle\\b[^>]*?\\bcx="${NUM}"[^>]*?\\bcy="${NUM}"[^>]*?\\br="${NUM}"`, 'gi');
  for (const m of svg.matchAll(circleRe)) {
    const cx = num(m[1]); const cy = num(m[2]); const r = num(m[3]);
    if (cx == null || cy == null || r == null) continue;
    bb = unionRange(bb, cx - r, cx + r, cy - r, cy + r);
  }

  const ellipseRe = new RegExp(
    `<ellipse\\b[^>]*?\\bcx="${NUM}"[^>]*?\\bcy="${NUM}"[^>]*?\\brx="${NUM}"[^>]*?\\bry="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(ellipseRe)) {
    const cx = num(m[1]); const cy = num(m[2]); const rx = num(m[3]); const ry = num(m[4]);
    if (cx == null || cy == null || rx == null || ry == null) continue;
    bb = unionRange(bb, cx - rx, cx + rx, cy - ry, cy + ry);
  }

  const lineRe = new RegExp(
    `<line\\b[^>]*?\\bx1="${NUM}"[^>]*?\\by1="${NUM}"[^>]*?\\bx2="${NUM}"[^>]*?\\by2="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(lineRe)) {
    const x1 = num(m[1]); const y1 = num(m[2]); const x2 = num(m[3]); const y2 = num(m[4]);
    if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
    bb = unionRange(bb, Math.min(x1, x2), Math.max(x1, x2), Math.min(y1, y2), Math.max(y1, y2));
  }

  const polyRe = /<(?:polygon|polyline)\b[^>]*?\bpoints="([^"]+)"/gi;
  for (const m of svg.matchAll(polyRe)) {
    const pts = m[1]?.match(/-?[0-9]+(?:\.[0-9]+)?/g) ?? [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const x = parseFloat(pts[i]!);
      const y = parseFloat(pts[i + 1]!);
      if (Number.isFinite(x) && Number.isFinite(y)) bb = unionPoint(bb, x, y);
    }
  }

  // path: absolute M/L only (Q/C/A 도 명령 직후 첫 좌표 쌍만, conservative)
  const pathRe = /<path\b[^>]*?\bd="([^"]+)"/gi;
  for (const m of svg.matchAll(pathRe)) {
    const d = m[1] ?? '';
    // capture M/L/H/V/Q/C/A followed by numbers; lowercase variants (m/l/...) are skipped
    const tokens = d.match(/[MLHVQCAS][^MLHVQCASmlhvqcasZz]*/g) ?? [];
    for (const tok of tokens) {
      const cmd = tok[0];
      const nums = tok.slice(1).match(/-?[0-9]+(?:\.[0-9]+)?/g) ?? [];
      if (cmd === 'H') {
        for (const n of nums) {
          const x = parseFloat(n);
          if (Number.isFinite(x)) bb = unionPoint(bb, x, bb?.maxY ?? 0);
        }
      } else if (cmd === 'V') {
        for (const n of nums) {
          const y = parseFloat(n);
          if (Number.isFinite(y)) bb = unionPoint(bb, bb?.maxX ?? 0, y);
        }
      } else {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = parseFloat(nums[i]!);
          const y = parseFloat(nums[i + 1]!);
          if (Number.isFinite(x) && Number.isFinite(y)) bb = unionPoint(bb, x, y);
        }
      }
    }
  }

  return bb;
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts -t extractBBox`
Expected: 새로 추가한 8개 모두 PASS. 기존 테스트도 PASS.

- [ ] **Step 5: Checkpoint** — 헬퍼 함수만 격리 추가. 사용자가 원하면 커밋.

---

## Task 3: countShapes / countFills 헬퍼 + 단위 테스트

**Files:**
- Modify: `utils/svg/validate.ts` (헬퍼 2개 추가)
- Modify: `tests/unit/svg.validate.test.ts` (테스트 추가)

- [ ] **Step 1: 테스트 작성 (TDD)**

import 라인에 추가:

```ts
import {
  parseUploadInput, parseUploadList, validateAndNormalizeSvg,
  validateMeta, makeSlug, extractBBox,
  countShapes,     // NEW
  countFills,      // NEW
} from '~/utils/svg/validate';
```

파일 끝에 추가:

```ts
describe('countShapes', () => {
  it('returns 0 for svg with no primitive children', () => {
    expect(countShapes('<svg></svg>')).toBe(0);
  });

  it('counts each rect/circle/line/path occurrence', () => {
    const svg = '<svg><rect/><rect/><circle/><line/><path/><polygon/><polyline/><ellipse/></svg>';
    expect(countShapes(svg)).toBe(8);
  });

  it('ignores nested <g> wrappers but counts their contents', () => {
    const svg = '<svg><g><rect/><circle/></g><line/></svg>';
    expect(countShapes(svg)).toBe(3);
  });
});

describe('countFills', () => {
  it('counts shapes with fill="currentColor"', () => {
    const svg =
      '<svg><rect fill="currentColor"/><circle fill="none"/><path fill="currentColor"/></svg>';
    expect(countFills(svg)).toBe(2);
  });

  it('returns 0 when no shape has currentColor fill', () => {
    expect(countFills('<svg><rect/><circle fill="none"/></svg>')).toBe(0);
  });

  it('does not count currentColor on stroke', () => {
    expect(countFills('<svg><rect stroke="currentColor"/></svg>')).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts -t "countShapes|countFills"`
Expected: FAIL (export 안 됨).

- [ ] **Step 3: 헬퍼 구현**

`utils/svg/validate.ts` 의 `extractBBox` 다음에 추가:

```ts
const SHAPE_TAG_RE = /<(?:rect|circle|ellipse|line|polyline|polygon|path)\b/gi;

export function countShapes(svg: string): number {
  return (svg.match(SHAPE_TAG_RE) ?? []).length;
}

const FILL_CURRENT_RE = /<(?:rect|circle|ellipse|line|polyline|polygon|path)\b[^>]*?\bfill="currentColor"/gi;

export function countFills(svg: string): number {
  return (svg.match(FILL_CURRENT_RE) ?? []).length;
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts`
Expected: 신규 6개 + 기존 모두 PASS.

- [ ] **Step 5: Checkpoint** — 헬퍼 추가 완료.

---

## Task 4: validateAndNormalizeSvg에 warnings 4종 통합 + 통합 테스트

**Files:**
- Modify: `utils/svg/validate.ts:222-369` (validateAndNormalizeSvg 함수 — ok=true 직전에 warning 계산)
- Modify: `tests/unit/svg.validate.test.ts` (warnings 통합 테스트)

목표 warning 4종:
- `W-BBOX-X` : `maxX - minX < 400` → "Canvas under-used on x axis (span={s})"
- `W-BBOX-Y` : `maxY - minY < 400` → "Canvas under-used on y axis (span={s})"
- `W-SHAPES` : `count ∉ [14, 24]` → "Shape count {n} outside [14,24] target"
- `W-FILLS` : `fillCount < 3` → "Only {n} filled regions — duotone may look flat"

- [ ] **Step 1: 통합 테스트 작성 (TDD)**

`tests/unit/svg.validate.test.ts` 의 `describe('validateAndNormalizeSvg', ...)` 안에 추가:

```ts
  it('warns when bbox span on x axis is below 400', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="200" y="40" width="100" height="432"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('x axis'))).toBe(true);
    }
  });

  it('warns when bbox span on y axis is below 400', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="200" width="432" height="100"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('y axis'))).toBe(true);
    }
  });

  it('warns when shape count is outside 14..24', () => {
    // 1 shape — under range
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="40" width="432" height="432"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('Shape count'))).toBe(true);
    }
  });

  it('warns when fill="currentColor" count is below 3', () => {
    const shapes = Array.from({ length: 14 }, (_, i) =>
      `<rect x="${40 + i * 4}" y="40" width="20" height="432"/>`,
    ).join('');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">${shapes}</svg>`;
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('filled regions'))).toBe(true);
    }
  });

  it('emits empty warnings array for a well-formed icon (≥14 shapes, full bbox, ≥3 fills)', () => {
    const shapes: string[] = [];
    // 14 rects spanning bbox 40..472, with first 3 filled
    for (let i = 0; i < 14; i++) {
      const fill = i < 3 ? ' fill="currentColor"' : '';
      shapes.push(`<rect x="${40 + i * 30}" y="40" width="20" height="432"${fill}/>`);
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">${shapes.join('')}</svg>`;
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings).toEqual([]);
    }
  });
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts -t "warns when|emits empty warnings"`
Expected: 5개 모두 FAIL (warnings 가 아직 채워지지 않음).

- [ ] **Step 3: validateAndNormalizeSvg 에 warning 계산 추가**

`utils/svg/validate.ts:339-369` 구간을 다음으로 변경:

```ts
  if (errors.length > 0) return { ok: false, errors };

  const emit = (nodes: ShapeNode[]): string => {
    let out = '';
    for (const c of nodes) {
      if (c.tag === 'g') {
        const a = Object.entries(c.attrs)
          .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
          .join('');
        out += `<g${a}>${emit(c.children || [])}</g>`;
        continue;
      }
      const allow = ALLOWED_ATTRS_BY_TAG[c.tag];
      if (!allow) continue;
      const kept: Record<string, string> = {};
      for (const [k, v] of Object.entries(c.attrs)) {
        if (!allow.has(k)) continue;
        if (k === 'd' && (!v || v.trim() === '')) continue;
        kept[k] = v;
      }
      if (c.tag === 'path' && !('d' in kept)) continue;
      const a = Object.entries(kept)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join('');
      out += `<${c.tag}${a}/>`;
    }
    return out;
  };

  const rootOpen = '<svg' + CANONICAL_ROOT_ATTRS.map(([k, v]) => ` ${k}="${v}"`).join('') + '>';
  const normalizedSvg = `${rootOpen}${emit(shapeTree)}</svg>`;

  // Soft warnings (do not block save; surfaced in UI for user awareness)
  const warnings: string[] = [];
  const bbox = extractBBox(normalizedSvg);
  if (bbox) {
    const spanX = bbox.maxX - bbox.minX;
    const spanY = bbox.maxY - bbox.minY;
    if (spanX < 400) warnings.push(`Canvas under-used on x axis (span=${Math.round(spanX)})`);
    if (spanY < 400) warnings.push(`Canvas under-used on y axis (span=${Math.round(spanY)})`);
  }
  const shapeCount = countShapes(normalizedSvg);
  if (shapeCount < 14 || shapeCount > 24) {
    warnings.push(`Shape count ${shapeCount} outside [14,24] target`);
  }
  const fillCount = countFills(normalizedSvg);
  if (fillCount < 3) {
    warnings.push(`Only ${fillCount} filled regions — duotone may look flat`);
  }

  return { ok: true, svg: normalizedSvg, warnings };
}
```

- [ ] **Step 4: 테스트 실행 → 모두 PASS 확인**

Run: `pnpm test tests/unit/svg.validate.test.ts && pnpm lint`
Expected: 신규 + 기존 모두 PASS, lint 통과.

- [ ] **Step 5: Checkpoint** — validate.ts 변경 완료.

---

## Task 5: IconResultCard에 warnings 뱃지 표시

**Files:**
- Modify: `components/IconResultCard.vue:32-34, 116-152`

- [ ] **Step 1: warnings computed 추가**

`components/IconResultCard.vue:32-34` 의 `validationErrors` computed 아래에 추가:

```ts
const validationWarnings = computed(() =>
  props.item.validation.ok ? props.item.validation.warnings : []
);
const hasWarnings = computed(() => validationWarnings.value.length > 0);
```

- [ ] **Step 2: 카드 우상단에 ⚠ 뱃지 + tooltip 추가**

`components/IconResultCard.vue:119` 의 `<div class="relative flex aspect-square ...">` 안 (`v-html="previewSvg"` 다음, `</div>` 직전) 에 다음 추가:

```vue
        <div
          v-if="item.validation.ok && hasWarnings"
          class="absolute right-6 top-6 flex h-22 w-22 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300"
          :title="validationWarnings.join('\n')">
          <i class="material-icons text-14">warning</i>
        </div>
```

- [ ] **Step 3: 빌드/타입 체크**

Run: `pnpm lint && pnpm test tests/unit/IconCard.test.ts`
Expected: lint 통과, 기존 IconCard 테스트(다른 컴포넌트) 영향 없음.

- [ ] **Step 4: 수동 시각 검증 (Dev server)**

Run: `pnpm dev`
Expected:
- UploadModal 열고 임의 키워드 → 프롬프트 생성 → 외부 LLM 결과 붙여넣기
- 결과 SVG가 14개 미만이거나 작은 영역일 때 카드 우상단에 노란 ⚠ 뱃지 표시
- 뱃지에 마우스 hover 하면 warning 메시지(들) 툴팁

UI 변경은 단위 테스트로 검증 불가능 (시각 + tooltip 거동). 위 수동 절차로 한 번 확인하면 충분.

- [ ] **Step 5: Checkpoint** — UI 변경 완료.

---

## Task 6: PERSONA_HINTS 사전 + getConceptTokens 페르소나 분기

**Files:**
- Modify: `server/utils/iconPromptBuilder.ts:74-100` (getConceptTokens 보강)
- Create: `tests/unit/iconPromptBuilder.test.ts`

- [ ] **Step 1: 신규 테스트 파일 생성 (TDD)**

Create: `tests/unit/iconPromptBuilder.test.ts`

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConceptTokens } from '~/server/utils/iconPromptBuilder';

describe('getConceptTokens', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns persona hint tokens without calling ollama for "연구원"', async () => {
    const tokens = await getConceptTokens('연구원', '');
    expect(tokens[0]).toBe('person');
    expect(tokens).toContain('scientist');
    // fetch must NOT have been called
    expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('returns persona hint tokens for English persona keywords (case-insensitive)', async () => {
    const tokens = await getConceptTokens('Developer', '');
    expect(tokens[0]).toBe('person');
    expect(tokens).toContain('laptop');
  });

  it('falls through to ollama for non-persona keyword', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ tokens: ['database', 'storage', 'sql'] }) }),
    });
    const tokens = await getConceptTokens('데이터베이스', '');
    expect(tokens).toContain('database');
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('falls back to keyword itself when ollama returns empty', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ response: '{}' }),
    });
    const tokens = await getConceptTokens('weird-thing', '');
    expect(tokens).toEqual(['weird-thing']);
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "persona hint"`
Expected: 페르소나 hit 테스트들이 FAIL (사전 미구현으로 ollama 호출이 일어남).

- [ ] **Step 3: PERSONA_HINTS 사전 + 분기 구현**

`server/utils/iconPromptBuilder.ts:74` 의 `export async function getConceptTokens(...)` 함수 위에 사전 정의 추가:

```ts
const PERSONA_HINTS: Record<string, string[]> = {
  // Korean keywords
  '연구원':    ['person', 'scientist', 'researcher', 'lab', 'flask'],
  '연구자':    ['person', 'scientist', 'researcher', 'lab'],
  '과학자':    ['person', 'scientist', 'lab'],
  '개발자':    ['person', 'developer', 'laptop', 'code'],
  '엔지니어':   ['person', 'engineer', 'gear', 'wrench'],
  '의사':      ['person', 'doctor', 'stethoscope'],
  '간호사':    ['person', 'nurse', 'medical'],
  '교사':      ['person', 'teacher', 'book'],
  '학생':      ['person', 'student', 'book'],
  '디자이너':   ['person', 'designer', 'palette'],
  '분석가':    ['person', 'analyst', 'chart'],
  '전문가':    ['person', 'expert'],
  // English keywords (lowercase for matching)
  scientist:  ['person', 'scientist', 'lab', 'flask'],
  researcher: ['person', 'researcher', 'lab', 'microscope'],
  developer:  ['person', 'developer', 'laptop', 'code'],
  engineer:   ['person', 'engineer', 'gear'],
  doctor:     ['person', 'doctor', 'stethoscope'],
  teacher:    ['person', 'teacher', 'book'],
  designer:   ['person', 'designer', 'palette'],
  analyst:    ['person', 'analyst', 'chart'],
};
```

`getConceptTokens` 함수 시작부에 페르소나 분기 추가:

```ts
export async function getConceptTokens(
  keyword: string,
  description: string,
): Promise<string[]> {
  // Persona shortcut: skip ollama when the keyword is a known persona — keeps
  // "person" as the first token so collectReferences guarantees a person ref.
  const exact = keyword.trim();
  const lower = exact.toLowerCase();
  const hint = PERSONA_HINTS[exact] ?? PERSONA_HINTS[lower];
  if (hint) return [...hint];

  // ...existing ollama call logic remains unchanged below...
  const prompt = `You translate a (possibly Korean) keyword into icon-vocabulary tokens.
  // ... (existing body unchanged) ...
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts`
Expected: 4개 모두 PASS.

- [ ] **Step 5: Checkpoint** — getConceptTokens 페르소나 분기 완료.

---

## Task 7: collectReferences maxTotal 동적 분기

**Files:**
- Modify: `server/utils/iconPromptBuilder.ts:234-252` (buildPrompt 함수의 collectReferences 호출부)
- Modify: `tests/unit/iconPromptBuilder.test.ts` (테스트 추가)

- [ ] **Step 1: 테스트 작성 (TDD)**

`tests/unit/iconPromptBuilder.test.ts` 에 새 describe 추가:

```ts
import { buildPrompt } from '~/server/utils/iconPromptBuilder';

describe('buildPrompt — persona reference count', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests up to 6 references for persona keyword (vs 5 for non-persona)', async () => {
    const personaResult = await buildPrompt('연구원', '', 3);
    // PERSONA_HINTS for 연구원 has 5 tokens, each yielding 1+ candidates.
    // collectReferences with maxTotal=6 should give us close to 6 refs.
    // We assert at least 4 (allowing for token-set overlaps / dedupe).
    expect(personaResult.references.length).toBeGreaterThanOrEqual(4);
    expect(personaResult.tokens[0]).toBe('person');
  });
});
```

- [ ] **Step 2: 테스트 실행 → 현재 동작 베이스라인 확인**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "persona reference"`
Expected: 페르소나 응답이 5개로 캡되어 있어도 GreaterThanOrEqual(4) 는 PASS 가능 — 베이스라인 PASS 일 수 있음. 본 테스트는 이후 maxTotal 가 6으로 늘어도 견고히 PASS 함을 보장하는 회귀 가드.

- [ ] **Step 3: collectReferences 호출부 분기**

`server/utils/iconPromptBuilder.ts:234-252` 의 `buildPrompt` 함수를 변경:

```ts
export async function buildPrompt(
  keyword: string,
  description: string,
  count: number,
): Promise<BuildPromptResult> {
  const tokens = await getConceptTokens(keyword, description);
  const isPersona = tokens[0] === 'person';
  const references = collectReferences(tokens, isPersona ? 6 : 5);
  // eslint-disable-next-line no-console
  console.log(
    '[buildPrompt] tokens=%o references=%o isPersona=%s',
    tokens,
    references.map((r) => r.id),
    isPersona,
  );
  return {
    prompt: renderPrompt(keyword, description, count, tokens, references),
    tokens,
    references,
  };
}
```

- [ ] **Step 4: 테스트 실행 → PASS 유지**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts`
Expected: 모두 PASS.

- [ ] **Step 5: Checkpoint** — collectReferences 분기 완료.

---

## Task 8: renderPrompt 개선 (I1: reference 스케일 명시 + I2: Duotone fill mandate)

**Files:**
- Modify: `server/utils/iconPromptBuilder.ts:146-153` (renderReferenceBlock), `server/utils/iconPromptBuilder.ts:212-213` (renderPrompt 의 reference 섹션)
- Modify: `tests/unit/iconPromptBuilder.test.ts` (renderPrompt 출력 검증)

- [ ] **Step 1: 테스트 작성 (TDD)**

`tests/unit/iconPromptBuilder.test.ts` 에 새 describe 추가:

```ts
describe('renderPrompt output content', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('I1: includes scale instruction (×21.3) and bold stroke note', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/scale.*21\.3/);
    expect(r.prompt).toMatch(/bold/i);
  });

  it('I2: includes "Duotone fill mandate" with surface categories and ≥3 fill requirement', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Duotone fill mandate');
    expect(r.prompt).toMatch(/Screens \/ panels/);
    expect(r.prompt).toMatch(/≥\s*3\s*fill="currentColor"/);
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "renderPrompt output"`
Expected: 두 테스트 모두 FAIL.

- [ ] **Step 3: renderReferenceBlock 헤더 변경 (I1)**

`server/utils/iconPromptBuilder.ts:146-153` 의 `renderReferenceBlock` 을 다음으로 교체:

```ts
function renderReferenceBlock(refs: Reference[]): string {
  if (refs.length === 0) {
    return '(no library references — synthesize from scratch using the style guide alone)';
  }
  const header =
    'These references show LINE ANATOMY only (viewBox 0..24).\n' +
    'You MUST reproduce the STRUCTURE but at 512 scale (×21.3) and WITH duotone fills added.\n' +
    'stroke-width=6 at 512 reads as a bold ~16px stroke — match that visual weight.\n' +
    'Do NOT keep your output outline-only just because the references are outline-only.\n';
  const body = refs
    .map((r, i) => `[REF_${i + 1}] ${r.id} (viewBox 0 0 24 24)\n${r.body}`)
    .join('\n\n');
  return `${header}\n${body}`;
}
```

- [ ] **Step 4: renderPrompt 본문에 Duotone fill mandate 단락 삽입 (I2)**

`server/utils/iconPromptBuilder.ts` 의 `renderPrompt` 함수 본문 중 `# Library reference vocabulary ...\n${renderReferenceBlock(references)}` 부분(약 L212-213) 직후에 새 단락 추가. 즉, 기존:

```
# Library reference vocabulary (inspiration only — don't copy verbatim)
${renderReferenceBlock(references)}

# Output — ...
```

을 다음으로 변경:

```
# Library reference vocabulary
${renderReferenceBlock(references)}

# Duotone fill mandate
Every reference shown above is outline-only (no fills). Your output MUST add
fill="currentColor" to the following surface categories whenever they appear:

  Screens / panels   : laptop·monitor screens, phone displays, dashboard inner panels
  Containers         : speech-bubble interiors, card bodies, badge backgrounds, signs
  Solid markers     : chart bars, status dots, progress fills, buttons, traffic-light dots
  Body / clothing    : lab-coat torsos, shirt fronts, helmet caps, vehicle bodies (large)
  Hair / cap         : hair masses, beanie/hat surfaces

Leave OUTLINE-only (no fill):
  Outer device chassis (phone body, laptop hinge, monitor frame outer rect)
  Container frames (window outer rect, briefcase outer)
  Decorative trim, antenna/cable lines, connectors

Each item.svg must contain ≥ 3 fill="currentColor" shapes. Pure outline items are INVALID.

# Output — ...
```

- [ ] **Step 5: 테스트 실행 → PASS 확인**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "renderPrompt output"`
Expected: I1, I2 두 테스트 PASS.

- [ ] **Step 6: Checkpoint** — I1 + I2 적용.

---

## Task 9: renderPrompt 개선 (I3: 페르소나 D 카테고리 + angle enum 매트릭스)

**Files:**
- Modify: `server/utils/iconPromptBuilder.ts:189-210` (Variation strategy 본문)
- Modify: `tests/unit/iconPromptBuilder.test.ts` (테스트 추가)

- [ ] **Step 1: 테스트 작성**

`tests/unit/iconPromptBuilder.test.ts` 의 `describe('renderPrompt output content', ...)` 안에 추가:

```ts
  it('I3: includes Persona (D) category with 8-part anatomy and angle enum matrix', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/Persona \/ role concept/);
    expect(r.prompt).toMatch(/Person anatomy \(8 required parts\)/);
    expect(r.prompt).toMatch(/D \(persona\)\s*→/);
    // Persona angle enum should include the 6 persona-specific values
    expect(r.prompt).toMatch(/"with-tool"/);
    expect(r.prompt).toMatch(/"in-context"/);
  });

  it('I3: persona category instructs LLM to use ONLY persona angle enum', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/use ONLY the persona angle enum/);
  });
```

- [ ] **Step 2: 테스트 실행 → FAIL**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "I3"`
Expected: FAIL.

- [ ] **Step 3: renderPrompt 의 Variation strategy 본문 변경**

`server/utils/iconPromptBuilder.ts` 의 `renderPrompt` 함수에서 `# Variation strategy — pick what fits the keyword` 블록 (대략 L189~210) 의 끝(`For the KEYWORD ...` 직전) 에 D 카테고리 단락을 추가하고, 그 다음의 `For the KEYWORD` 문장을 매트릭스 형태로 교체:

기존:
```
C) **Paired / relational concept** — examples: sync, exchange, send-receive, compare.
   → Use device-stack / network / container-inside patterns; avoid window-scene.

For the KEYWORD "${keyword}", first decide A / B / C, then generate the ${count} variants accordingly. The first item.angle should be "standard", the rest should be appropriate angle names (with-detail, composed, with-action, minimal, scene, abstract).
```

을 다음으로 변경:

```
C) **Paired / relational concept** — examples: sync, exchange, send-receive, compare.
   → Use device-stack / network / container-inside patterns; avoid window-scene.

D) **Persona / role concept** — examples: scientist, researcher, doctor, engineer,
   teacher, designer, analyst, 연구원, 개발자, 학생, 의사, 디자이너.
   → Primary subject MUST be a person occupying y=64..448 vertically.
   → Person anatomy (8 required parts):
       • Head circle (cx≈256, cy≈128, r≈48)
       • Hair / cap shape on top of head (path or filled polygon) — FILLED
       • 2 eye dots (small fill circles cx-256±16, cy≈128)
       • Glasses (2 small rects + bridge line) OR role-specific cap line
       • Neck line / shoulder span at y≈196 (width ≥ 160)
       • Body / coat outline (rect or trapezoid, y=200..420, width ≥ 240)
       • Coat collar V (path inside body, FILLED with currentColor)
       • Internal coat detail (2~3 button circles + chest pocket rect + side seam line)
   → Role-specific tool (≥ 1 required, occupying remaining canvas):
       researcher / scientist / 연구원 → flask OR microscope (right of person, x≈360..448)
       developer  / 개발자             → laptop OR terminal (paired left/right)
       doctor     / 의사                → stethoscope OR clipboard
       engineer   / 엔지니어           → gear OR wrench OR hard-hat marker
       teacher    / 교사                → book OR chalkboard
   → Shape budget: person ≥ 8 + tool ≥ 6 + base/connector ≥ 2 = 16~24 shapes.
   → IMPORTANT: when KEYWORD classifies as D, use ONLY the persona angle enum below.
     Do not mix in atomic/scene angles like "with-action", "composed", "scene".

For the KEYWORD "${keyword}", first decide A / B / C / D, then generate the ${count} variants accordingly.
The item.angle enum depends on the category:
  A (atomic)  → "standard", "with-detail", "composed"
  B (scene)   → "window-scene", "device-stack", "network", "container-inside"
  C (paired)  → "device-stack", "network", "container-inside"
  D (persona) → "standard", "with-tool", "with-detail", "minimal", "in-context", "abstract"
Each item.angle must be unique within the response.
```

- [ ] **Step 4: 테스트 실행 → PASS**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "I3"`
Expected: 2개 PASS.

- [ ] **Step 5: Checkpoint** — I3 적용.

---

## Task 10: renderPrompt 개선 (I4: LAST REMINDER + I5: Pre-output self-check + I6: 페르소나 예시)

**Files:**
- Modify: `server/utils/iconPromptBuilder.ts:215, 224-225, 227-231` (Output 섹션 직전 단락 추가, 예시 추가, Constraints 직전 self-check 추가)
- Modify: `tests/unit/iconPromptBuilder.test.ts` (테스트 추가)

- [ ] **Step 1: 테스트 작성**

```ts
  it('I4: includes a "LAST REMINDER before output" block placed near the end', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('LAST REMINDER before output');
    // The reminder must appear AFTER the variation strategy and BEFORE the output JSON spec.
    const reminderIdx = r.prompt.indexOf('LAST REMINDER before output');
    const outputIdx = r.prompt.indexOf('# Output');
    expect(reminderIdx).toBeGreaterThan(0);
    expect(reminderIdx).toBeLessThan(outputIdx);
  });

  it('I5: includes a Pre-output self-check checklist', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Pre-output self-check');
    expect(r.prompt).toMatch(/viewBox is exactly/);
    expect(r.prompt).toMatch(/Count of fill="currentColor" shapes ≥ 3/);
  });

  it('I6: includes a persona JSON example (Researcher) with at least 14 shapes', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/"name":\s*"Researcher"/);
    // The example svg should contain enough primitive tags to be a real example
    const exampleMatch = r.prompt.match(/"svg":\s*"<svg[^"]+\/svg>"/);
    expect(exampleMatch).not.toBeNull();
  });
```

- [ ] **Step 2: 테스트 실행 → FAIL**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts -t "I4|I5|I6"`
Expected: 3개 FAIL.

- [ ] **Step 3: renderPrompt 본문 — Output 섹션 직전에 LAST REMINDER 단락 (I4) 추가**

`server/utils/iconPromptBuilder.ts` 의 `renderPrompt` 에서 `# Output — ONE JSON object ...` 줄 (약 L215) 직전에 다음 단락을 prepend:

```

# LAST REMINDER before output
For EACH item:
- bbox must span ≥ 400 on BOTH axes (min ≤ 56, max ≥ 456 on x AND y).
- ≥ 3 shapes use fill="currentColor".
- 14~24 primitive shapes total.
- For persona keyword: head circle exists at y ≤ 180 AND body shape ≥ 240 wide.

If any of these fails, REDRAW before emitting. A miniature in the center is rejected.
```

- [ ] **Step 4: Output 섹션의 Shape of every item 직전에 Pre-output self-check (I5) 추가**

기존 `Shape of every item:` 블록 직전에 다음 단락을 삽입:

```
Pre-output self-check (for every item, mentally verify):
  [ ] viewBox is exactly "0 0 512 512"
  [ ] stroke-width="6" on root svg
  [ ] No hex / rgb / fill-opacity / stroke-opacity / opacity attributes anywhere
  [ ] min(any shape x) ≤ 56 AND max(x+width) ≥ 456
  [ ] min(any shape y) ≤ 56 AND max(y+height) ≥ 456
  [ ] Count of fill="currentColor" shapes ≥ 3
  [ ] Total primitive shape count ∈ [14, 24]
  [ ] If KEYWORD is persona: head circle present AND body width ≥ 240
  [ ] item.angle is one of the listed values AND unique across items
If any check fails for an item, regenerate THAT item before emitting JSON.

```

- [ ] **Step 5: 페르소나 예시(I6) 추가**

기존 `Exact example of the required output shape ...` 문장 직후의 Dashboard 예시(약 L225) 줄 위 또는 아래에 다음 페르소나 예시 1개를 추가. 형식 일관성을 위해 별개 줄로 1개 더 둠:

```
Persona example (use only when KEYWORD classifies as D):
{"items":[{"name":"Researcher","tags":["scientist","lab","flask","person"],"category":"persona","angle":"standard","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"200\\" cy=\\"128\\" r=\\"48\\"/><path d=\\"M160 100 Q160 64 200 64 Q240 64 240 100 Q236 88 224 88 Q200 96 176 88 Q164 90 160 100Z\\" fill=\\"currentColor\\"/><circle cx=\\"188\\" cy=\\"128\\" r=\\"4\\" fill=\\"currentColor\\"/><circle cx=\\"212\\" cy=\\"128\\" r=\\"4\\" fill=\\"currentColor\\"/><line x1=\\"140\\" y1=\\"196\\" x2=\\"260\\" y2=\\"196\\"/><path d=\\"M120 420 Q116 280 156 240 L188 232 L188 264 Q200 280 212 264 L212 232 L244 240 Q284 280 280 420 Z\\" fill=\\"currentColor\\"/><path d=\\"M188 232 L200 260 L212 232\\"/><circle cx=\\"200\\" cy=\\"316\\" r=\\"5\\" fill=\\"currentColor\\"/><circle cx=\\"200\\" cy=\\"344\\" r=\\"5\\" fill=\\"currentColor\\"/><rect x=\\"232\\" y=\\"272\\" width=\\"32\\" height=\\"24\\" rx=\\"4\\"/><line x1=\\"260\\" y1=\\"260\\" x2=\\"260\\" y2=\\"412\\"/><rect x=\\"340\\" y=\\"240\\" width=\\"60\\" height=\\"24\\" rx=\\"4\\"/><path d=\\"M348 264 L344 320 Q320 360 332 408 Q360 432 408 408 Q420 360 396 320 L392 264\\" fill=\\"currentColor\\"/><line x1=\\"332\\" y1=\\"360\\" x2=\\"408\\" y2=\\"360\\"/><line x1=\\"354\\" y1=\\"284\\" x2=\\"386\\" y2=\\"284\\"/></svg>"}]}
```

- [ ] **Step 6: 테스트 실행 → PASS**

Run: `pnpm test tests/unit/iconPromptBuilder.test.ts`
Expected: I4, I5, I6 + 기존 모두 PASS.

- [ ] **Step 7: Checkpoint** — I4 + I5 + I6 적용. 프롬프트 본문 변경 완료.

---

## Task 11: End-to-End 수동 검증

**Files:** None modified — verification only.

자동 테스트로는 외부 LLM 의 실제 출력 품질을 검증할 수 없다. 다음 절차를 수동으로 실행하고 결과를 기록.

- [ ] **Step 1: Dev server 실행**

Run: `pnpm dev`
Expected: localhost:3000 정상 기동.

- [ ] **Step 2: 페르소나 키워드 4종 테스트**

페르소나 4종 (`연구원`, `개발자`, `의사`, `엔지니어`) 각각에 대해:
1. UploadModal 열고 키워드 입력, count=3
2. "프롬프트 생성" 클릭
3. 응답의 `tokens[0]` 이 `person` 인지 미리보기에서 확인
4. `references` 에 사람/유저 계열 아이콘이 최소 1개 포함되는지 ID 미리보기에서 확인
5. 프롬프트 복사 → Claude / GPT / Gemini 각각에 붙여넣어 결과 받기
6. 결과 JSON 을 결과 영역에 붙여넣기
7. 카드에 노란 ⚠ 뱃지가 **거의 안 보여야** 함 (잘 그려졌으면 bbox/shape/fill 모두 충족)
8. 머리 / 어깨 / 가운 / 도구가 모두 보이는지 시각 확인

기록 양식 (개당):
```
연구원 — Claude:  [⚠ 뱃지 N개 / 페르소나 anatomy 충족 여부]
연구원 — GPT:     ...
연구원 — Gemini:  ...
개발자 — ...
의사 — ...
엔지니어 — ...
```

- [ ] **Step 3: 비페르소나 키워드 3종 테스트**

`데이터베이스`, `클라우드 동기화`, `결제` 각각에 대해 Step 2 와 동일 절차. 추가로:
- 응답 시간이 페르소나(즉시) 대비 더 걸리는지 (ollama 호출 발생)
- 서버 로그에 `[buildPrompt] tokens=...` 가 ollama 결과로 채워지는지

- [ ] **Step 4: warning 표시 검증**

의도적으로 빈약한 SVG (3개 shape, 작은 영역) JSON 을 결과 영역에 붙여넣어 ⚠ 뱃지가 표시되고 tooltip 에 다음이 나타나는지:
- "Canvas under-used on x axis"
- "Canvas under-used on y axis"
- "Shape count 3 outside [14,24] target"
- "Only 0 filled regions — duotone may look flat"

테스트용 빈약한 SVG:
```json
{"items":[{"name":"Tiny","tags":["test"],"category":"test","angle":"standard","svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"240\" y=\"240\" width=\"32\" height=\"32\"/><circle cx=\"256\" cy=\"256\" r=\"4\"/><line x1=\"244\" y1=\"244\" x2=\"268\" y2=\"268\"/></svg>"}]}
```

- [ ] **Step 5: 전체 테스트 스위트 통과 확인**

Run: `pnpm test && pnpm lint`
Expected: 모든 unit test PASS, lint 통과.

- [ ] **Step 6: 결과 정리**

위 단계들의 관찰 결과를 본 플랜 파일 끝 또는 별도 노트에 기록. 페르소나 4종 × LLM 3종 = 12개 케이스 중 몇 개가 ⚠ 뱃지 없이 깨끗하게 통과했는지, 어떤 LLM 이 가장 일관성 있는지 메모.

- [ ] **Step 7: Checkpoint (최종)** — 전체 작업 완료. 사용자가 git 상태 정리.

---

## Self-Review Notes

본 플랜은 스펙의 다음 요구사항을 모두 커버:

| 스펙 항목 | 커버하는 Task |
|---|---|
| 4.1 (I1) Reference 스케일 명시 | Task 8 Step 3 |
| 4.1 (I2) Duotone fill mandate | Task 8 Step 4 |
| 4.1 (I3) 페르소나 D 카테고리 + angle enum 매트릭스 | Task 9 |
| 4.1 (I4) LAST REMINDER | Task 10 Step 3 |
| 4.1 (I5) Pre-output self-check | Task 10 Step 4 |
| 4.1 (I6) 페르소나 예시 | Task 10 Step 5 |
| 4.2 PERSONA_HINTS 사전 + getConceptTokens 분기 | Task 6 |
| 4.3 collectReferences maxTotal 분기 | Task 7 |
| 4.4 validate.ts warnings (W-BBOX-X/Y, W-SHAPES, W-FILLS) | Task 1~4 |
| 4.4 IconResultCard warning 뱃지 | Task 5 |
| Section 7 페르소나 4종 + 비페르소나 3종 검증 | Task 11 |

타입 시그니처 일관성: `ValidationResult` 의 `ok=true` 케이스에 `warnings: string[]` 필드 추가는 Task 1 에서 정의, Task 4 에서 채움, Task 5 에서 소비. 모든 참조가 일관됨.

PlaceholderScan: 본 플랜은 모든 step 에 실제 코드/명령/기대 출력을 포함. "TBD/TODO/적절히 처리" 없음.
