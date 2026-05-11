# Multi-Result Icon Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업로드 모달을 "외부 LLM이 N개(default 4, 4~8) 변형을 한 번에 출력 → 카드 그리드로 표시 → 카드별 [저장]/[복사]" 흐름으로 전환한다.

**Architecture:** 백엔드(`POST /api/icons`) 무수정. 프론트엔드만 변경. (1) `composables/promptGuide.ts` 의 프롬프트 템플릿을 `{ items: [...] }` wrapper + Variation Mandate enum 강제로 재작성하고 `buildPrompt`에 `count` 파라미터 추가. (2) `utils/svg/validate.ts`에 `parseUploadList` 신설 (단일/배열/legacy 모두 정규화). (3) `UploadModal`을 결과 배열 ref + `IconResultCard` 그리드로 재작성 (단일 미리보기/메타폼/footer 제거).

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, TypeScript, Pinia, Tailwind, shadcn-vue, Vitest + happy-dom + `@vue/test-utils`, better-sqlite3, `fast-xml-parser`.

**Spec:** [`docs/superpowers/specs/2026-05-07-multi-result-icon-generation-design.md`](../specs/2026-05-07-multi-result-icon-generation-design.md)

---

## File Structure

```
composables/promptGuide.ts            (modify) — buildPrompt 시그니처 + 템플릿 재작성
utils/svg/validate.ts                 (modify) — parseUploadList 추가, ParsedItem 타입 export
components/PromptGuidePanel.vue       (modify) — count selector + count prop 추가
components/UploadModal.vue            (modify) — 단일 미리보기/메타폼/footer 제거, 결과 카드 그리드
components/IconResultCard.vue         (create) — 카드 1장 + [저장] [복사]
tests/unit/promptGuide.test.ts        (create) — buildPrompt unit tests
tests/unit/svg.validate.test.ts       (modify) — parseUploadList 케이스 추가
```

---

## Task 1: Setup — git init (idempotent)

**Files:** N/A (CWD ops)

- [ ] **Step 1: Initialize git repo if not already**

Run: `git rev-parse --is-inside-work-tree 2>/dev/null || git init`
Expected: 출력 `true` (이미 init) 또는 `Initialized empty Git repository in ...` (신규).

- [ ] **Step 2: Verify required dev dependencies are installed**

Run: `pnpm list vitest @vue/test-utils happy-dom 2>/dev/null | head -20`
Expected: 세 패키지 모두 출력에 등장 (이미 `package.json` devDependencies에 있음).

- [ ] **Step 3: Verify base test suite passes**

Run: `pnpm test`
Expected: 기존 test (`tests/unit/svg.transform.test.ts`, `tests/unit/svg.validate.test.ts`, `tests/api/icons.test.ts`) 모두 PASS.

- [ ] **Step 4: Initial commit (only if working tree had uncommitted state from `git init`)**

```bash
git status --porcelain | head -1
```

If output is non-empty (즉 staged/unstaged 변경 있음), 작업 시작 전 baseline commit:

```bash
git add -A
git commit -m "chore: baseline before multi-result icon generation work"
```

If `git status --porcelain` 비어있으면 이 커밋 생략.

---

## Task 2: parseUploadList — write failing tests

**Files:**
- Modify: `tests/unit/svg.validate.test.ts`

- [ ] **Step 1: Open the test file and locate `describe('parseUploadInput', ...)` block**

Run: `grep -n "parseUploadInput\|parseUploadList\|describe(" tests/unit/svg.validate.test.ts | head`
Expected: `describe('parseUploadInput', ...)` 와 `describe('validateAndNormalizeSvg', ...)` 만 존재 (parseUploadList는 아직 없음).

- [ ] **Step 2: Append the import addition + new describe block at the bottom of the file**

Add the following to `tests/unit/svg.validate.test.ts`:

```ts
import { parseUploadList } from '~/utils/svg/validate';

describe('parseUploadList', () => {
  it('returns [] for empty input', () => {
    expect(parseUploadList('')).toEqual([]);
    expect(parseUploadList('   \n\t  ')).toEqual([]);
  });

  it('parses { items: [...] } wrapper with multiple items', () => {
    const input = JSON.stringify({
      items: [
        { name: 'Car', tags: ['vehicle'], category: 'transport', angle: 'standard', svg: '<svg id="a"/>' },
        { name: 'Car', tags: ['vehicle', 'minimal'], category: 'transport', angle: 'minimal', svg: '<svg id="b"/>' },
      ],
    });
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].svg).toBe('<svg id="a"/>');
    expect(r[0].meta?.name).toBe('Car');
    expect(r[0].meta?.tags).toEqual(['vehicle']);
    expect(r[1].svg).toBe('<svg id="b"/>');
    expect(r[1].meta?.tags).toEqual(['vehicle', 'minimal']);
  });

  it('parses raw top-level array', () => {
    const input = JSON.stringify([
      { name: 'A', svg: '<svg id="a"/>' },
      { name: 'B', svg: '<svg id="b"/>' },
    ]);
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].meta?.name).toBe('A');
    expect(r[1].meta?.name).toBe('B');
  });

  it('parses single legacy { name, svg, ... } object as 1-item array', () => {
    const input = '{"name":"X","tags":["a"],"category":"c","svg":"<svg/>"}';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toBe('<svg/>');
    expect(r[0].meta?.name).toBe('X');
    expect(r[0].meta?.tags).toEqual(['a']);
  });

  it('strips ```json code fences before parsing', () => {
    const input = '```json\n{"items":[{"svg":"<svg/>","name":"X"}]}\n```';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toBe('<svg/>');
    expect(r[0].meta?.name).toBe('X');
  });

  it('extracts multiple <svg>...</svg> when input is not JSON', () => {
    const input = 'Sure!\n<svg id="x"></svg>\nand also\n<svg id="y"></svg>\nthank you';
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].svg).toMatch(/id="x"/);
    expect(r[0].meta).toBeNull();
    expect(r[1].svg).toMatch(/id="y"/);
    expect(r[1].meta).toBeNull();
  });

  it('extracts single <svg>...</svg> when input is loose prose', () => {
    const input = 'here is your icon: <svg id="only"></svg>';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toMatch(/id="only"/);
    expect(r[0].meta).toBeNull();
  });

  it('returns [] when JSON parses but has no svg field', () => {
    const r = parseUploadList('{"foo":"bar"}');
    expect(r).toEqual([]);
  });

  it('skips items without a string svg field in items array', () => {
    const input = JSON.stringify({
      items: [
        { name: 'A', svg: '<svg id="a"/>' },
        { name: 'B' },                  // no svg
        { name: 'C', svg: 123 },        // wrong type
        { name: 'D', svg: '<svg id="d"/>' },
      ],
    });
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].meta?.name).toBe('A');
    expect(r[1].meta?.name).toBe('D');
  });
});
```

- [ ] **Step 3: Run new tests, verify they fail**

Run: `pnpm test -- svg.validate`
Expected: `parseUploadList` describe 블록 안 모든 테스트 FAIL with `parseUploadList is not a function` / 또는 import 에러. 기존 `parseUploadInput`, `validateAndNormalizeSvg` 테스트는 PASS 유지.

---

## Task 3: parseUploadList — implement + commit

**Files:**
- Modify: `utils/svg/validate.ts`

- [ ] **Step 1: Add `ParsedItem` type and `extractItem` helper**

Open `utils/svg/validate.ts`. *Above* the existing `parseUploadInput` function (around line 15), add:

```ts
export type ParsedItem = { svg: string; meta: Partial<IconMeta> | null };

const SVG_GLOBAL_RE = /<svg[\s\S]*?<\/svg>/gi;

function extractItem(j: unknown): ParsedItem | null {
  if (!j || typeof j !== 'object' || typeof (j as { svg?: unknown }).svg !== 'string') {
    return null;
  }
  const obj = j as Record<string, unknown>;
  const meta: Partial<IconMeta> = {};
  if (typeof obj.name === 'string') meta.name = obj.name;
  if (Array.isArray(obj.tags)) {
    meta.tags = obj.tags.filter((t: unknown): t is string => typeof t === 'string');
  }
  if (typeof obj.category === 'string') meta.category = obj.category;
  if (typeof obj.description === 'string') meta.description = obj.description;
  return { svg: obj.svg as string, meta };
}
```

> Note: We will also export a `ResultItem` UI-state type from this same module after `ValidationResult` is declared (Step 3 below) — it depends on `ValidationResult` and is consumed by both `IconResultCard.vue` and `UploadModal.vue`, so co-locating it with the other SVG-domain types avoids fragile `<script setup>` re-exports.

- [ ] **Step 2: Add `parseUploadList` after the existing `parseUploadInput` function**

Locate the end of `parseUploadInput` (it ends with `return { svg: svgMatch ? svgMatch[0] : s, meta: null };` followed by `}`). Below that function, *before* `export type ValidationResult`, add:

```ts
export function parseUploadList(raw: string): ParsedItem[] {
  let s = raw.trim();
  if (s.length === 0) return [];

  const fenceMatch = s.match(CODE_FENCE_RE);
  if (fenceMatch) s = fenceMatch[1].trim();

  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const j = JSON.parse(s);
      if (j && typeof j === 'object' && !Array.isArray(j) && Array.isArray((j as { items?: unknown }).items)) {
        const items = ((j as { items: unknown[] }).items)
          .map((it) => extractItem(it))
          .filter((x): x is ParsedItem => x !== null);
        if (items.length > 0) return items;
      }
      if (Array.isArray(j)) {
        const items = j
          .map((it) => extractItem(it))
          .filter((x): x is ParsedItem => x !== null);
        if (items.length > 0) return items;
      }
      const single = extractItem(j);
      if (single) return [single];
    } catch {
      /* fall through to raw <svg> matching */
    }
  }

  const matches = s.match(SVG_GLOBAL_RE);
  if (matches && matches.length > 0) {
    return matches.map((m) => ({ svg: m, meta: null }));
  }

  return [];
}
```

- [ ] **Step 3: Add `ResultItem` UI-state type at the end of `utils/svg/validate.ts`**

Append at the very bottom of the file (after `makeFallbackSlug`):

```ts
export type ResultItem = {
  id: string;
  svg: string;                    // normalized SVG (or original if validation failed)
  validation: ValidationResult;
  rawMeta: ParsedItem['meta'];
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `pnpm test -- svg.validate`
Expected: 모든 `parseUploadList` 테스트 PASS. 기존 `parseUploadInput`, `validateAndNormalizeSvg` 테스트도 그대로 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/svg.validate.test.ts utils/svg/validate.ts
git commit -m "feat(svg): add parseUploadList and ResultItem for multi-item flow"
```

---

## Task 4: buildPrompt — write failing tests

**Files:**
- Create: `tests/unit/promptGuide.test.ts`

- [ ] **Step 1: Create the new test file**

Create `tests/unit/promptGuide.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { buildPrompt, PROMPT_GUIDE_TEMPLATE } from '~/composables/promptGuide';

describe('buildPrompt', () => {
  it('replaces <KEYWORD> slot with the trimmed keyword', () => {
    const out = buildPrompt('  Car  ');
    expect(out).toContain('KEYWORD: Car');
    expect(out).not.toContain('<KEYWORD>');
  });

  it('replaces <DESC_BLOCK> with DESCRIPTION line when description provided', () => {
    const out = buildPrompt('Car', 'sedan with sunroof');
    expect(out).toContain('DESCRIPTION: sedan with sunroof');
  });

  it('removes <DESC_BLOCK> placeholder when description is empty', () => {
    const out = buildPrompt('Car');
    expect(out).not.toContain('<DESC_BLOCK>');
    expect(out).not.toContain('DESCRIPTION:');
  });

  it('defaults count to 4 when not provided', () => {
    const out = buildPrompt('Car');
    expect(out).not.toContain('<COUNT>');
    expect(out).toMatch(/정확히 4개/);
  });

  it('uses provided count between 4 and 8', () => {
    const out = buildPrompt('Car', undefined, 6);
    expect(out).toMatch(/정확히 6개/);
    expect(out).toMatch(/items\.length === 6/);
  });

  it('clamps count above 8 down to 8', () => {
    const out = buildPrompt('Car', undefined, 99);
    expect(out).toMatch(/정확히 8개/);
  });

  it('clamps count below 4 up to 4', () => {
    const out = buildPrompt('Car', undefined, 1);
    expect(out).toMatch(/정확히 4개/);
  });

  it('clamps non-finite count to 4', () => {
    const out = buildPrompt('Car', undefined, Number.NaN);
    expect(out).toMatch(/정확히 4개/);
  });
});

describe('PROMPT_GUIDE_TEMPLATE', () => {
  it('declares { items: [...] } wrapper schema, not single-object schema', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"items"');
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Variation Mandate/);
  });

  it('lists the angle enum for diversity enforcement', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"standard"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"with-action"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"minimal"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"composed"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"in-context"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"with-detail"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"abstract"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"scene"');
  });

  it('forbids raw array / code fences / prose at top level', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/raw array만 두는 것 금지/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/코드펜스/);
  });
});
```

- [ ] **Step 2: Run new tests, verify they fail**

Run: `pnpm test -- promptGuide`
Expected: 모든 새 테스트 FAIL — `<COUNT>` placeholder가 아직 없거나, "Variation Mandate" 문자열 없음, 또는 buildPrompt가 3번째 파라미터를 무시.

---

## Task 5: buildPrompt + template — implement + commit

**Files:**
- Modify: `composables/promptGuide.ts`

- [ ] **Step 1: Replace the entire content of `composables/promptGuide.ts` with the new template + signature**

Open `composables/promptGuide.ts` and *replace the whole file* with:

```ts
export const PROMPT_GUIDE_TEMPLATE =
  `You are an icon designer creating *original* duotone outline icons in the **Phosphor Duotone / iconoir / Solar Linear** tradition. Each icon is a **creative interpretation** of the KEYWORD — never a template copy. Output ONLY a single JSON object containing an "items" array — no prose, no code fences, no commentary.

KEYWORD: <KEYWORD>
<DESC_BLOCK>
## Brief
- Canvas: viewBox **0 0 512 512**.
- Safe area: x=40..472, y=40..472 (사방 40 unit margin).
- Identity: 정밀한 anatomy + 단일 thin stroke + duotone surface fill.
- Mood: 차분, 의미 있음, *장식 없음*. 모든 shape는 *기능적 의미*를 가진다.

## ⚠️ Prime Directive (모든 규칙보다 우선)
**서로 다른 객체의 body는 절대 겹치지 않는다.**
- 보조 심볼이 *내부 의미*(잠금·재생·코드 등)면 → primary의 화면/표면 *내부 사각 영역*에 그린다.
- 보조 객체가 *외부 관계*(연동·동기·신호)면 → 떨어뜨려 *connector 라인*(실선 또는 점선)으로 연결.
- 모서리 overlay·외부 badge는 절대 금지.

## Variation Mandate (배열 출력 시 필수)
- **정확히 <COUNT>개**의 item을 출력. 부족하거나 초과 금지.
- 각 item은 다음 enum 중 *중복 없는* 1개 angle을 가진다:
  ["standard", "with-action", "minimal", "composed", "in-context", "with-detail", "abstract", "scene"]
- 각 item은 *다른 composition pattern* (Single Center / Stack / Scene-Tree)을 골고루 사용하라.
- 각 item은 *다른 객체 조합 / 다른 anatomy 초점*을 가져야 한다. 같은 구도에서 minor variation만 두는 것은 거절.

## Stroke (단일)
- 모든 shape는 root 상속 stroke-width 6. 표시 96px 기준 ~1.1px (사실상 1px).
- 같은 굵기를 일관되게. 두께 변화 금지.

## Duotone Color (가장 중요 — 정확히 따를 것)
사용자는 단일 color 1개만 고른다. 렌더 시:
- **stroke=currentColor → 선택 색상 그대로** (full opacity)
- **fill=currentColor 큰 surface (면적 > 800) → 선택 색상 + 40% opacity 자동 틴트**
- **fill=currentColor 작은 marker (면적 ≤ 800) → 선택 색상 opaque**
- **fill 미지정/none → outline only (stroke만 보임)**

따라서 너의 결정:
- **객체 본체 외곽** (폰 body, 카드 body 외곽, 집 외형, 시계 band): fill 안 씀 → outline only.
- **객체 내부 *주요 surface*** (폰 화면 rect, 시계 face circle, 모니터 화면 rect, 문서 콘텐츠 영역, 차트 배경, 카드면, 창문, 화면 안 콘텐츠 카드): **fill="currentColor" 명시** → 자동 40% 틴트.
- **작은 의미 표지** (헤더 dot, 키홀, 인디케이터 점, ▶, 체크 ✓): **fill="currentColor"** + 작은 r → opaque marker.
- 핵심: *각 객체마다 최소 1개의 surface*가 fill=currentColor이어야 좌우 균형 잡힌 듀오톤이 나옴.

❌ 안 되는 것: 큰 outline 본체에 fill="currentColor" (전체가 칠해져서 답답해짐).
✅ 되는 것: 본체는 outline, *내부 surface*에만 fill="currentColor".

## Composition
- 객체 1~4개 (4 초과 금지). 각 객체는 *4~8개의 기능적 anatomy*를 가진다 — silhouette 환원 금지.
- 패턴은 자유롭게:
  - **Single Center**: 객체 1개 중앙. 화면 안에 풍부한 anatomy.
  - **Stack**: 수직·수평 적층. 객체 사이 ≥16 unit gap.
  - **Scene-Tree**: 2~4개 객체 분산 + connector 라인.

## Creative Latitude
- KEYWORD을 *의미적으로 풍부하게* 해석하라. 단일 단어라도 *맥락의 핵심 디테일*을 함께 그린다.
  - "Security" → 자물쇠 + 방패 + 키 디테일 / "Payment" → 카드(칩+마그네틱+번호) + 화폐 / "Smart Home" → 집 + wifi + 디바이스 + dashed connector / "Analytics" → 모니터 + 차트 (막대/도넛/라인)
- 예시를 그대로 베끼지 말고 *해석*하라.

## Form Vocabulary
| 형태 | 추천 요소 |
|---|---|
| 사각 객체 (폰·카드·노트북·집·서버) | <rect> with rx |
| 둥근 객체 (시계·방패·구·렌즈) | <circle> / <ellipse> |
| 자유 곡선 (구름·연기·물결·잎) | <path> with Q/C/A |
| 직선 anatomy (격자·콘텐츠 라인) | <line> / <polyline> |
| 화살표·체크·재생·삼각 | <polyline> / <polygon> |
| 호 (wifi·signal·궤도) | <path> with arc |
| 점·인디케이터·키홀 | <circle> small with fill |

## Marker Sizing
- 인디케이터 점·키홀·헤더 dot 등 *opaque marker*: r=4~7 max.
- 헤더 traffic dots: r=6, fill="currentColor", 동일 크기 3개.

## Output Rules
1. 루트는 정확히: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">. width/height 두지 마라.
2. 색은 오직 "currentColor". hex/rgb/그라디언트 금지.
3. surface(큰 fill 영역)와 marker(작은 fill 영역) 모두 fill="currentColor" 사용. 차이는 *면적*이 자동 결정.
4. Connector 점선이 어울리면 stroke-dasharray="10 10".
5. 허용 요소: <path>, <circle>, <rect>, <line>, <polyline>, <polygon>, <ellipse>.
6. 금지: <defs>, <linearGradient>, <radialGradient>, <pattern>, <mask>, <clipPath>, <filter>, <use>, <image>, <script>, <style>, <foreignObject>, on*, inline style.
7. **도형 수 14~24 typical (28까지 허용, 30이 하드 캡).** 13 이하면 silhouette 위험.
8. 모든 shape는 x=40..472, y=40..472 안.
9. 최상위는 { "items": [...] } 객체. raw array만 두는 것 금지, 코드펜스(\\\`\\\`\\\`json … \\\`\\\`\\\`) 금지, 어떠한 prose도 금지.
10. items.length === <COUNT>.

## Self-Check (모두 통과해야 출력)
1. 서로 다른 객체 body가 닿거나 겹치지 않는가?
2. 도형 수 14~24 사이? 각 객체 anatomy 4~8?
3. *각 객체마다* 내부에 fill="currentColor" surface 1~2개씩 있나? (그래야 듀오톤 양쪽 균형)
4. 본체 외곽 (큰 outline body)에 fill="currentColor" 안 들어갔나? (outline-only이어야 함)
5. 마커 dot/keyhole r=4~7?
6. 사방 40 unit margin 확보?
7. KEYWORD을 *창의적으로 디테일하게* 해석했는가?
8. 좌표가 .0 또는 .5 정렬?
9. items 배열 길이가 정확히 <COUNT>인가? items[i].angle이 모두 다른 enum 값인가?
10. items[i].svg와 items[j].svg가 silhouette 단계에서 분명히 구분되는가?

## Schema (description 출력 금지)
{
  "items": [
    {
      "name": string,        // KEYWORD을 영문 Title Case로 *직역*. 추가 단어 금지.
                             //   "결제" → "Payment" (NOT "Payment Method")
                             //   "스마트홈 보안" → "Smart Home Security"
      "tags": string[],      // 3~6개 영문 소문자 단일 단어. KEYWORD에서 파생.
      "category": string,    // 영문 소문자 1단어 (예: "device", "finance", "system", "iot", "ui")
      "angle": string,       // Variation Mandate enum 중 1개. items 사이 중복 금지.
      "svg": string          // 위 Output Rules를 정확히 따름
    }
    // ... 정확히 <COUNT>개 ...
  ]
}

## Example — Smart Home Security (2-item, 다양성 보여주는 *구조* 예시)
*해석*: items[0]은 "scene" angle (집 + wifi + 폰 dashed connector), items[1]은 "minimal" angle (자물쇠 1개 단순). 두 개의 다른 angle, 다른 구도, 다른 anatomy 초점.
{
  "items": [
    {
      "name": "Smart Home Security",
      "tags": ["smarthome", "security", "iot", "wifi", "lock"],
      "category": "iot",
      "angle": "scene",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><polyline points=\\"60,272 170,144 280,272\\"/><rect x=\\"80\\" y=\\"272\\" width=\\"180\\" height=\\"160\\"/><rect x=\\"100\\" y=\\"180\\" width=\\"28\\" height=\\"76\\"/><rect x=\\"106\\" y=\\"304\\" width=\\"48\\" height=\\"48\\" fill=\\"currentColor\\"/><rect x=\\"170\\" y=\\"336\\" width=\\"60\\" height=\\"96\\" fill=\\"currentColor\\"/><path d=\\"M 90 130 Q 170 56 250 130\\"/><path d=\\"M 114 152 Q 170 96 226 152\\"/><path d=\\"M 138 172 Q 170 140 202 172\\"/><circle cx=\\"170\\" cy=\\"184\\" r=\\"6\\" fill=\\"currentColor\\"/><rect x=\\"328\\" y=\\"184\\" width=\\"120\\" height=\\"240\\" rx=\\"20\\"/><rect x=\\"346\\" y=\\"216\\" width=\\"84\\" height=\\"172\\" fill=\\"currentColor\\"/><rect x=\\"356\\" y=\\"296\\" width=\\"64\\" height=\\"68\\" rx=\\"4\\" fill=\\"currentColor\\"/><path d=\\"M 366 296 V 276 a 22 22 0 0 1 44 0 V 296\\"/><circle cx=\\"388\\" cy=\\"328\\" r=\\"5\\" fill=\\"currentColor\\"/><line x1=\\"376\\" y1=\\"408\\" x2=\\"400\\" y2=\\"408\\"/><line x1=\\"260\\" y1=\\"208\\" x2=\\"328\\" y2=\\"264\\" stroke-dasharray=\\"10 10\\"/></svg>"
    },
    {
      "name": "Smart Home Security",
      "tags": ["smarthome", "security", "lock", "minimal"],
      "category": "iot",
      "angle": "minimal",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><rect x=\\"176\\" y=\\"244\\" width=\\"160\\" height=\\"168\\" rx=\\"12\\" fill=\\"currentColor\\"/><path d=\\"M 200 244 V 196 a 56 56 0 0 1 112 0 V 244\\"/><circle cx=\\"256\\" cy=\\"312\\" r=\\"14\\" fill=\\"currentColor\\"/><line x1=\\"256\\" y1=\\"326\\" x2=\\"256\\" y2=\\"364\\"/></svg>"
    }
  ]
}

이 예시는 *원리*만 보여준다 — 너의 KEYWORD에 맞게 *완전히 새로운 구도*로 그려라. 좌표를 그대로 복사하지 마라.
` as const;

export function buildPrompt(keyword: string, description?: string, count: number = 4): string {
  const safeKeyword = keyword.trim().length > 0 ? keyword.trim() : '(키워드를 입력하세요)';
  const trimmed = description?.trim() ?? '';
  const descBlock = trimmed.length > 0 ? `DESCRIPTION: ${trimmed}\n` : '';
  const rawCount = Number.isFinite(count) ? Math.floor(count) : 4;
  const safeCount = Math.max(4, Math.min(8, rawCount));
  return PROMPT_GUIDE_TEMPLATE
    .replace('<KEYWORD>', safeKeyword)
    .replace('<DESC_BLOCK>', descBlock)
    .replaceAll('<COUNT>', String(safeCount));
}
```

> Note: The `\\\`\\\`\\\`` sequence in Output Rules item 9 is intentional — it's an escaped backtick triple inside a template literal so the rendered prompt shows literal ```` ``` ```` (the LLM sees it as a forbidden code fence example).

- [ ] **Step 2: Run prompt tests, verify they pass**

Run: `pnpm test -- promptGuide`
Expected: 모든 9개 buildPrompt 테스트 + 3개 PROMPT_GUIDE_TEMPLATE 테스트 PASS.

- [ ] **Step 3: Run full test suite to ensure no regressions**

Run: `pnpm test`
Expected: 전체 PASS. svg.transform / svg.validate / icons api / promptGuide 모두 OK.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm exec nuxt typecheck 2>&1 | tail -30 || pnpm exec tsc --noEmit 2>&1 | tail -30`
Expected: 타입 에러 없음. (백엔드/검증 모듈은 promptGuide를 import하지 않으므로 영향 없음.)

- [ ] **Step 5: Commit**

```bash
git add tests/unit/promptGuide.test.ts composables/promptGuide.ts
git commit -m "feat(prompt): emit { items: [...] } array with Variation Mandate enum"
```

---

## Task 6: PromptGuidePanel — count selector

**Files:**
- Modify: `components/PromptGuidePanel.vue`

- [ ] **Step 1: Replace the file content with the count-aware version**

Replace `components/PromptGuidePanel.vue` with:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { buildPrompt } from '~/composables/promptGuide';

const props = defineProps<{ keyword: string; description?: string }>();

const count = ref<number>(4);
const prompt = computed(() => buildPrompt(props.keyword, props.description, count.value));
const copied = ref(false);

async function copy() {
  await navigator.clipboard.writeText(prompt.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

defineExpose({ count });
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="mb-12 flex items-center justify-between gap-8">
      <h3 class="text-14 font-semibold text-gray-800">Prompt</h3>
      <div class="flex items-center gap-8">
        <label class="flex items-center gap-4 text-12 text-gray-600">
          결과 개수
          <select
            v-model.number="count"
            class="h-28 rounded-md border border-gray-200 bg-white px-8 text-12 outline-none focus:border-primary">
            <option :value="4">4</option>
            <option :value="5">5</option>
            <option :value="6">6</option>
            <option :value="7">7</option>
            <option :value="8">8</option>
          </select>
        </label>
        <button
          type="button"
          class="flex items-center gap-4 rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-600 transition hover:bg-gray-100"
          @click="copy">
          <template v-if="copied">복사됨</template>
          <template v-else>
            <i class="material-icons -ms-2 text-14">content_copy</i>
            프롬프트 복사
          </template>
        </button>
      </div>
    </div>
    <pre
      class="max-h-[24rem] flex-1 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-12 text-12 leading-relaxed text-gray-700"
      >{{ prompt }}</pre
    >
    <p class="mt-8 text-12 text-gray-500">
      이 프롬프트를 본인 Claude/ChatGPT/Gemini에 붙여넣고, 결과 JSON({ items: [...] })을 우측에 붙여넣어
      주세요.
    </p>
  </div>
</template>
```

- [ ] **Step 2: Verify the change works in dev**

Run: `pnpm dev` (background OK)
Then in browser open `http://localhost:3000`, search for any keyword (e.g. "Car"), click the "+" upload card.
Expected:
- 모달이 열리면 PromptGuidePanel 헤더에 `결과 개수` select 박스(default 4)가 보인다.
- select를 6으로 바꾸면 `<pre>` 안 프롬프트 텍스트의 "정확히 4개" → "정확히 6개"로 즉시 변경된다.
- "프롬프트 복사" 버튼 동작은 그대로 유지.

- [ ] **Step 3: Stop dev server and commit**

Stop the running `pnpm dev`. Then:

```bash
git add components/PromptGuidePanel.vue
git commit -m "feat(panel): add result count selector to PromptGuidePanel"
```

---

## Task 7: IconResultCard — implement + commit (no component tests; manual verify)

**Files:**
- Create: `components/IconResultCard.vue`

> Note: 컴포넌트 단위 테스트는 P1로 미루고 (spec §11), 이 카드는 다음 Task의 UploadModal 통합 후 브라우저에서 수동 검증한다.

- [ ] **Step 1: Create `components/IconResultCard.vue`**

Create the file with content:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IconDto } from '~/stores/search';
import { useSearch } from '~/stores/search';
import { useCustomize } from '~/stores/customize';
import { applyCustomize } from '~/utils/svg/transform';
import { validateMeta } from '~/utils/svg/validate';
import type { ResultItem } from '~/utils/svg/validate';

const props = defineProps<{ item: ResultItem; fallbackName: string }>();

const search = useSearch();
const c = useCustomize();

const customize = computed(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => {
  if (!props.item.validation.ok) return '';
  return applyCustomize(props.item.svg, customize.value);
});

type SavedState = 'idle' | 'saving' | 'saved' | 'error';
const savedState = ref<SavedState>('idle');
const errorMessage = ref<string>('');
const copyFlash = ref(false);

const validationErrors = computed(() =>
  props.item.validation.ok ? [] : props.item.validation.errors
);

const saveLabel = computed(() => {
  switch (savedState.value) {
    case 'saving':
      return '저장 중…';
    case 'saved':
      return '저장됨';
    case 'error':
      return '재시도';
    default:
      return '저장';
  }
});

const saveDisabled = computed(
  () => !props.item.validation.ok || savedState.value === 'saving' || savedState.value === 'saved'
);

const copyLabel = computed(() => (copyFlash.value ? '복사됨' : '복사'));

async function onSave() {
  if (saveDisabled.value) return;
  savedState.value = 'saving';
  errorMessage.value = '';

  const llm = props.item.rawMeta ?? {};
  const v = validateMeta({
    name: llm.name ?? props.fallbackName,
    tags: llm.tags ?? [],
    category: llm.category ?? '',
    description: llm.description ?? '',
  });
  let metaToPost;
  if (v.ok) {
    metaToPost = v.meta;
  } else {
    metaToPost = {
      name: props.fallbackName,
      tags: [],
      category: '',
      description: '',
    };
  }

  try {
    const res = await fetch('/api/icons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: metaToPost.name,
        tags: metaToPost.tags,
        category: metaToPost.category,
        description: metaToPost.description,
        svg: props.item.svg,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
    }
    const saved = (await res.json()) as IconDto;
    search.add(saved);
    savedState.value = 'saved';
  } catch (e: unknown) {
    savedState.value = 'error';
    errorMessage.value = e instanceof Error ? e.message : '저장 실패';
  }
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(props.item.svg);
    copyFlash.value = true;
    setTimeout(() => (copyFlash.value = false), 1500);
  } catch {
    /* clipboard unavailable; ignore silently */
  }
}
</script>

<template>
  <div
    class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
    :class="{ 'opacity-70': !item.validation.ok }">
    <div
      class="relative flex aspect-square items-center justify-center"
      style="background-image:
        linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px);
        background-size: 32px 32px;">
      <div v-if="item.validation.ok" class="text-gray-800" v-html="previewSvg" />
      <div v-else class="px-12 text-center text-12 text-gray-400">미리보기 불가</div>
    </div>

    <div class="flex flex-col gap-4 border-t border-gray-200 px-12 py-8">
      <div
        v-if="!item.validation.ok"
        class="text-11 text-danger">
        {{ validationErrors[0] ?? 'SVG가 표준에 맞지 않습니다' }}
      </div>
      <div v-if="errorMessage" class="text-11 text-danger">{{ errorMessage }}</div>
      <div class="flex justify-end gap-4">
        <button
          type="button"
          class="rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saveDisabled"
          @click="onSave">
          {{ saveLabel }}
        </button>
        <button
          type="button"
          class="rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-700 transition hover:bg-gray-100"
          @click="onCopy">
          {{ copyLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify import paths and types resolve**

Run: `pnpm exec nuxt typecheck 2>&1 | grep -E "IconResultCard|error" | head -20`
Expected: `IconResultCard.vue` 관련 에러 없음. (UploadModal는 아직 카드를 import하지 않으므로 빌드는 통과.)

- [ ] **Step 3: Commit**

```bash
git add components/IconResultCard.vue
git commit -m "feat(card): add IconResultCard with save/copy actions"
```

---

## Task 8: UploadModal — replace single-input flow with results grid

**Files:**
- Modify: `components/UploadModal.vue`

- [ ] **Step 1: Replace the file content with the multi-result version**

Replace `components/UploadModal.vue` entirely with:

```vue
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { parseUploadList, validateAndNormalizeSvg } from '~/utils/svg/validate';
import type { ResultItem } from '~/utils/svg/validate';
import PromptGuidePanel from '~/components/PromptGuidePanel.vue';
import IconResultCard from '~/components/IconResultCard.vue';

const props = defineProps<{ open: boolean; keyword: string }>();
const emit = defineEmits<{ close: [] }>();

type Tab = 'paste' | 'file';
const tab = ref<Tab>('paste');
const localKeyword = ref<string>('');
const description = ref<string>('');
const rawInput = ref<string>('');
const errors = ref<string[]>([]);
const results = ref<ResultItem[]>([]);

let resettingOnOpen = false;

watch(
  () => props.open,
  (open) => {
    if (open) {
      resettingOnOpen = true;
      rawInput.value = '';
      localKeyword.value = props.keyword || '';
      description.value = '';
      errors.value = [];
      results.value = [];
      tab.value = 'paste';
      nextTick(() => {
        resettingOnOpen = false;
      });
    }
  }
);

watch(rawInput, (val) => {
  if (resettingOnOpen) return;
  if (!val.trim()) {
    results.value = [];
    return;
  }
  results.value = parseUploadList(val).map((p, i) => {
    const v = validateAndNormalizeSvg(p.svg);
    return {
      id: `r-${Date.now()}-${i}`,
      svg: v.ok ? v.svg : p.svg,
      validation: v,
      rawMeta: p.meta,
    };
  });
});

const validResultCount = computed(
  () => results.value.filter((r) => r.validation.ok).length
);

function onOpenChange(v: boolean) {
  if (!v) emit('close');
}

async function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  rawInput.value = await f.text();
}

async function onDrop(e: DragEvent) {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  rawInput.value = await f.text();
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent size="xl">
      <template #header>
        <DialogHeader>
          <DialogTitle>SVG 업로드</DialogTitle>
          <DialogDescription>
            외부 AI(Claude/ChatGPT/Gemini)로 만든 다중 결과 JSON을 붙여넣고, 마음에 드는 카드를
            카드별로 저장하세요.
          </DialogDescription>
        </DialogHeader>
      </template>

      <div class="space-y-24">
        <div>
          <label class="text-13 font-medium text-gray-700">
            키워드
            <span class="text-danger">*</span>
          </label>
          <input
            placeholder="예: AWS 클라우드 아이콘"
            class="mt-4 h-40 w-full rounded-md border border-gray-200 bg-white px-12 text-14 outline-none focus:border-primary"
            v-model="localKeyword" />
          <p class="mt-4 text-12 text-gray-500">
            이 키워드가 아래 프롬프트의 KEYWORD 자리에 자동으로 들어갑니다.
          </p>
        </div>

        <label class="block text-13 text-gray-700">
          설명
          <textarea
            rows="3"
            maxlength="500"
            placeholder="아이콘 생성에 사용할 부가 설명을 입력하세요."
            class="mt-4 w-full resize-y rounded-md border border-gray-200 px-12 py-8 text-13 outline-none focus:border-primary"
            v-model="description" />
          <span class="mt-2 block text-right text-12 text-gray-400">
            {{ description.length }} / 500
          </span>
        </label>

        <div class="grid grid-cols-1 gap-24 md:grid-cols-2">
          <PromptGuidePanel :keyword="localKeyword" :description="description" />

          <div class="flex flex-col gap-8">
            <div class="inline-flex w-fit rounded-md border border-gray-200 bg-white p-2 text-12">
              <button
                type="button"
                class="rounded px-12 py-4 transition"
                :class="
                  tab === 'paste'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                "
                @click="tab = 'paste'">
                Paste
              </button>
              <button
                type="button"
                class="rounded px-12 py-4 transition"
                :class="
                  tab === 'file'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                "
                @click="tab = 'file'">
                File
              </button>
            </div>

            <textarea
              v-if="tab === 'paste'"
              class="h-[14rem] w-full resize-none rounded-md border border-gray-200 bg-white p-12 font-mono text-12 outline-none focus:border-primary"
              placeholder='{ "items": [ { "name": "...", "tags": [...], "category": "...", "angle": "...", "svg": "<svg ...>...</svg>" }, ... ] }'
              v-model="rawInput" />
            <div
              v-else
              class="flex h-[14rem] cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-13 text-gray-500"
              @dragover.prevent
              @drop="onDrop">
              <label class="cursor-pointer text-center">
                <input
                  type="file"
                  accept="image/svg+xml,.svg,application/json,.json"
                  class="hidden"
                  @change="onPickFile" />
                .svg 또는 .json 파일을 드래그하거나 클릭해서 선택
              </label>
            </div>
          </div>
        </div>

        <div v-if="results.length > 0">
          <div class="mb-12 text-13 text-gray-600">
            결과 · {{ localKeyword || '키워드 없음' }} · {{ results.length }}개
            <span v-if="validResultCount !== results.length" class="text-gray-400">
              (valid {{ validResultCount }} / invalid {{ results.length - validResultCount }})
            </span>
          </div>
          <div class="grid grid-cols-2 gap-12 md:grid-cols-3 lg:grid-cols-4">
            <IconResultCard
              v-for="item in results"
              :key="item.id"
              :item="item"
              :fallback-name="localKeyword || ''" />
          </div>
        </div>

        <div
          v-if="errors.length > 0"
          class="border-danger/30 bg-danger/10 rounded-md border p-12 text-12 text-danger">
          <ul class="ml-16 list-disc">
            <li :key="e" v-for="e in errors">{{ e }}</li>
          </ul>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec nuxt typecheck 2>&1 | tail -30`
Expected: 새 import (`parseUploadList`, `IconResultCard`, `ResultItem`)가 모두 해석됨. 에러 없음.

> If typecheck reports `'saved'` event removed but parent still listens to it: that's an upstream issue (parent component still has `@saved="..."`). Check the next step.

- [ ] **Step 3: Update parent (caller of UploadModal) to drop `@saved` listener**

Run: `grep -rn 'UploadModal' --include='*.vue' /Users/jmchoi/Desktop/incoassets`
Expected: identify the file that mounts `<UploadModal>` (likely `pages/index.vue` or a layout).

For each match in that file:
- If the template has `@saved="..."` on `<UploadModal>`, remove that attribute (the modal no longer emits `saved`; cards push to `useSearch()` directly).
- Keep `@close="..."` and `:keyword="..."` attributes as-is.

Re-run: `pnpm exec nuxt typecheck 2>&1 | tail -10`
Expected: 에러 없음.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: 모든 unit/api 테스트 PASS. (UploadModal 자체 컴포넌트 테스트는 spec P1에 따라 이번 PR 범위 외.)

- [ ] **Step 5: Manual browser verification — golden path**

Run: `pnpm dev` (background OK)

In browser:
1. `http://localhost:3000` 접속, 검색바에 "Car" 입력
2. `+ "Car" 업로드` 카드 클릭 → 모달 열림
3. 결과 개수 select에서 4 → 6으로 변경 → 프롬프트 영역의 텍스트가 "정확히 6개"로 갱신되는지 확인
4. 프롬프트 복사 후 외부 LLM에 붙여넣고 받은 `{ items: [...] }` JSON을 우측 textarea에 paste
5. **Expected:** 그리드에 N개의 카드가 렌더링됨. 각 카드는 grid paper 배경 + SVG 미리보기 + [저장] [복사] 버튼.
6. 한 카드의 [복사] 클릭 → 버튼이 "복사됨"으로 1.5초 표시됨. 클립보드에는 SVG 문자열이 들어 있어야 함.
7. 한 카드의 [저장] 클릭 → 버튼이 "저장 중…" → "저장됨" (비활성)으로 전환. 모달 뒤 라이브러리 그리드에 새 아이콘이 즉시 노출됨.
8. 다른 카드들도 [저장] 시 동일 동작. 저장된 카드는 다시 클릭해도 무동작.
9. Customize 패널에서 색/사이즈/스트로크 변경 → 모든 카드의 미리보기가 동시에 반영됨.
10. ESC 또는 Dialog 우상단 X 클릭 → 모달 닫힘. 다시 열면 rawInput / results / count(4 default)가 reset됨.

- [ ] **Step 6: Manual browser verification — error path**

11. 모달을 다시 열고, paste 영역에 잘못된 JSON 입력 (`{ "items": [{ "name": "X", "svg": "<svg viewBox='0 0 24 24'/>" }] }`).
    - **Expected:** 카드 1개가 회색 처리됨. "미리보기 불가" placeholder + 빨간 에러 메시지("viewBox..."). [저장] 비활성, [복사]는 활성.
12. paste 영역의 내용을 깡 raw `<svg>...</svg>` 1개로 바꿈 (정상 표준 SVG).
    - **Expected:** 1-card 그리드. [저장] 클릭 시 keyword를 fallback name으로 저장됨.
13. paste 영역을 비움.
    - **Expected:** 결과 그리드가 사라짐.

- [ ] **Step 7: Stop dev server and commit**

Stop the running `pnpm dev`. Then:

```bash
git add components/UploadModal.vue
# also stage parent file modified in step 3 if any
git status --short
git add <parent-file-paths-from-step-3>
git commit -m "feat(modal): replace single-input flow with multi-result card grid"
```

---

## Task 9: Final verification + plan close-out

**Files:** N/A

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: 전체 PASS. unit/svg.transform, unit/svg.validate, unit/promptGuide, api/icons 모두 OK.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 에러 0. (warning은 허용)

- [ ] **Step 3: Type check**

Run: `pnpm exec nuxt typecheck 2>&1 | tail -20`
Expected: 에러 0.

- [ ] **Step 4: Format check**

Run: `pnpm format`
Expected: 모든 파일 포맷 OK. 만약 실패하면 `pnpm format:fix` 후 재실행 + `git add` + `git commit -m "chore: format"`.

- [ ] **Step 5: Final dev smoke test**

Run: `pnpm dev`
Browser flow: `/` → 검색 → `+` 카드 → 모달 → 프롬프트 복사 → 외부 LLM에서 4-item array 받기 → paste → 카드 그리드 → 1개 저장 → 모달 닫기 → 라이브러리에 추가됐는지 확인.

Stop `pnpm dev`.

- [ ] **Step 6: Mark plan complete**

```bash
git log --oneline | head -10
```

Expected: 위 Tasks의 commit 6개가 순서대로 보임 (Task 3 / 5 / 6 / 7 / 8 / optional format = 5~6 commit).

---
