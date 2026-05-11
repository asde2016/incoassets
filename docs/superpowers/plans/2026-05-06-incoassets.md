# incoassets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nuxt 4 단일 앱으로 사내 SVG 자산 공유 플랫폼 구현. 검색 / 다운로드 / 업로드 / 삭제 + 외부 AI(Claude / ChatGPT / Gemini)용 프롬프트 가이드.

**Architecture:** SSR Nuxt + Nitro server routes + better-sqlite3 단일 파일 DB(FTS5 trigram). `validateAndNormalizeSvg`(검증/정규화)와 `applyCustomize`(Customize 변환)를 단일 모듈로 두고 클라이언트 미리보기·다운로드와 서버 업로드 검증이 동일 함수를 공유. 서버는 외부 LLM을 호출하지 않음 — 사용자에게 프롬프트 가이드만 노출.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind, Pinia, shadcn-nuxt, `better-sqlite3` (FTS5 trigram), `fast-xml-parser`, `nanoid`, Vitest, `@vue/test-utils`, `happy-dom`.

---

## Spec Reference

진실의 단일 출처: `docs/superpowers/specs/2026-05-06-incoassets-design.md`. 각 task는 스펙의 어느 절을 구현하는지 명시.

## File Map

| Path                               | 역할                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `package.json`                     | deps 추가, `build` 스크립트 변경                                          |
| `nuxt.config.ts`                   | `routeRules['/api/**'].proxy` 제거                                        |
| `.gitignore`                       | `data/` 추가                                                              |
| `vitest.config.ts`                 | Vitest 설정                                                               |
| `utils/svg/transform.ts`           | `applyCustomize` (클·서 공용)                                             |
| `utils/svg/validate.ts`            | `parseUploadInput`, `validateAndNormalizeSvg`, `validateMeta`, `makeSlug` |
| `utils/download.ts`                | `downloadSvg` (Blob + a[download])                                        |
| `composables/promptGuide.ts`       | 프롬프트 가이드 텍스트 + `buildPrompt(topic)`                             |
| `server/utils/db.ts`               | better-sqlite3 인스턴스 + `MIGRATIONS_SQL`                                |
| `server/plugins/db.ts`             | 부팅 시 마이그레이션 실행 + FTS5 검사                                     |
| `server/utils/repo/icons.ts`       | `insertIcon`, `listIcons`, `deleteIcon`                                   |
| `server/api/icons/index.post.ts`   | 업로드                                                                    |
| `server/api/icons/index.get.ts`    | 검색·목록                                                                 |
| `server/api/icons/[id].delete.ts`  | 삭제                                                                      |
| `stores/customize.ts`              | Pinia: size / strokeWidth / mode / colors                                 |
| `stores/search.ts`                 | Pinia: q / items / offset / hasMore + API 호출                            |
| `components/CustomizePanel.vue`    | 우측 sticky 패널                                                          |
| `components/IconCard.vue`          | 일반 아이콘 카드 (preview + dl + ×)                                       |
| `components/IconCreateCard.vue`    | "+" 업로드 카드                                                           |
| `components/IconGrid.vue`          | 그리드 + 무한스크롤                                                       |
| `components/PromptGuidePanel.vue`  | 업로드 모달 좌측 가이드                                                   |
| `components/UploadModal.vue`       | 업로드 모달 본체                                                          |
| `components/layouts/Header.vue`    | 로고 + 다크모드 토글                                                      |
| `pages/index.vue`                  | 메인 페이지 조립                                                          |
| `tests/fixtures/svg/...`           | 유효/무효 SVG 픽스처                                                      |
| `tests/unit/svg.transform.test.ts` | transform 단위 테스트                                                     |
| `tests/unit/svg.validate.test.ts`  | validate 단위 테스트                                                      |
| `tests/api/icons.test.ts`          | API 통합 테스트                                                           |

---

## Task 1: 의존성 추가 + 빌드 스크립트 + .gitignore + nuxt.config.ts

**Spec:** §1, §6.6, §11.

**Files:**

- Modify: `package.json`
- Modify: `nuxt.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add better-sqlite3 fast-xml-parser nanoid
pnpm add -D @types/better-sqlite3 vitest @vue/test-utils happy-dom
```

- [ ] **Step 2: `package.json` `scripts.build` 를 `nuxt build` 로 변경, `test` 스크립트 추가**

`package.json` 의 `scripts` 블록을 다음으로 교체:

```json
"scripts": {
  "build": "nuxt build",
  "dev": "nuxt dev",
  "font": "node ./iconfont/index.cjs",
  "preview": "nuxt build && nuxt preview",
  "postinstall": "nuxt prepare",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --check .",
  "format:fix": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: `nuxt.config.ts` 에서 `/api/**` proxy 제거\*\*

`nuxt.config.ts` 의 `routeRules` 블록을 다음으로 교체:

```ts
routeRules: {},
```

- [ ] **Step 4: `.gitignore` 에 `data/` 추가**

`.gitignore` 끝에 다음 라인 추가:

```
data/
```

- [ ] **Step 5: 빌드 검증**

Run: `pnpm install && pnpm build`
Expected: 빌드 성공. 에러 없음.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml nuxt.config.ts .gitignore
git commit -m "chore: add db/test deps and switch to nuxt build"
```

---

## Task 2: Vitest 설정

**Spec:** §10.1.

**Files:**

- Create: `vitest.config.ts`

- [ ] **Step 1: `vitest.config.ts` 작성**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
```

- [ ] **Step 2: 더미 테스트로 셋업 확인**

Create: `tests/unit/setup.test.ts`

```ts
import { describe, it, expect } from 'vitest';

describe('setup', () => {
  it('vitest works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 3: 더미 테스트 삭제 후 commit**

```bash
rm tests/unit/setup.test.ts
git add vitest.config.ts
git commit -m "chore: add vitest config"
```

---

## Task 3: `utils/svg/transform.ts` — Customize 적용 변환

**Spec:** §4.2, §8.2.

**Files:**

- Create: `utils/svg/transform.ts`
- Test: `tests/unit/svg.transform.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/unit/svg.transform.test.ts
import { describe, it, expect } from 'vitest';
import { applyCustomize } from '~/utils/svg/transform';

const baseSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M0 0L24 24"/>' +
  '<path d="M0 24L24 0" fill="currentColor"/>' +
  '</svg>';

describe('applyCustomize', () => {
  it('injects width/height/stroke-width on root', () => {
    const out = applyCustomize(baseSvg, {
      size: 32,
      strokeWidth: 1.5,
      mode: 'solid',
      colors: { color: '#ff0000' },
    });
    expect(out).toMatch(/width="32"/);
    expect(out).toMatch(/height="32"/);
    expect(out).toMatch(/stroke-width="1\.5"/);
  });

  it('Solid: replaces all currentColor with given color', () => {
    const out = applyCustomize(baseSvg, {
      size: 24,
      strokeWidth: 2,
      mode: 'solid',
      colors: { color: '#00aa00' },
    });
    expect(out).toContain('#00aa00');
    expect(out).not.toContain('currentColor');
  });

  it('Gradient: injects <defs><linearGradient> and replaces currentColor with url(#g_...)', () => {
    const out = applyCustomize(baseSvg, {
      size: 24,
      strokeWidth: 2,
      mode: 'gradient',
      colors: { start: '#ff0000', end: '#0000ff', angle: 90 },
    });
    expect(out).toMatch(/<defs><linearGradient id="g_[a-z0-9]+"/);
    expect(out).toMatch(/url\(#g_[a-z0-9]+\)/);
    expect(out).toContain('#ff0000');
    expect(out).toContain('#0000ff');
    expect(out).not.toContain('currentColor');
  });

  it('Gradient: each call uses unique uid', () => {
    const a = applyCustomize(baseSvg, {
      size: 24,
      strokeWidth: 2,
      mode: 'gradient',
      colors: { start: '#000', end: '#fff', angle: 45 },
    });
    const b = applyCustomize(baseSvg, {
      size: 24,
      strokeWidth: 2,
      mode: 'gradient',
      colors: { start: '#000', end: '#fff', angle: 45 },
    });
    const idA = a.match(/g_([a-z0-9]+)/)![1];
    const idB = b.match(/g_([a-z0-9]+)/)![1];
    expect(idA).not.toBe(idB);
  });

  it('Solid is idempotent for the same input', () => {
    const opts = { size: 24, strokeWidth: 2, mode: 'solid', colors: { color: '#123456' } } as const;
    const a = applyCustomize(baseSvg, opts);
    const b = applyCustomize(a, opts);
    expect(b).toBe(a);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- svg.transform`
Expected: FAIL — `Cannot find module '~/utils/svg/transform'`.

- [ ] **Step 3: `utils/svg/transform.ts` 구현**

```ts
// utils/svg/transform.ts
export type SolidColors = { color: string };
export type GradientColors = { start: string; end: string; angle: number };
export type CustomizeState =
  | { size: number; strokeWidth: number; mode: 'solid'; colors: SolidColors }
  | { size: number; strokeWidth: number; mode: 'gradient'; colors: GradientColors };

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;

function setOrAddAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}

function angleToCoords(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = 12,
    cy = 12,
    r = 12;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x1: round(cx - Math.cos(rad) * r),
    y1: round(cy - Math.sin(rad) * r),
    x2: round(cx + Math.cos(rad) * r),
    y2: round(cy + Math.sin(rad) * r),
  };
}

function makeUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function applyCustomize(svg: string, c: CustomizeState): string {
  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = attrs;
    a = setOrAddAttr(a, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    a = setOrAddAttr(a, 'stroke-width', String(c.strokeWidth));
    return `<svg${a}>`;
  });

  if (c.mode === 'solid') {
    return out.replace(/currentColor/g, c.colors.color);
  }

  const uid = makeUid();
  const { start, end, angle } = c.colors;
  const { x1, y1, x2, y2 } = angleToCoords(angle);
  const defs =
    `<defs><linearGradient id="g_${uid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0%" stop-color="${start}"/><stop offset="100%" stop-color="${end}"/>` +
    `</linearGradient></defs>`;
  out = out.replace(/(<svg\b[^>]*>)/i, `$1${defs}`);
  out = out.replace(/currentColor/g, `url(#g_${uid})`);
  return out;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- svg.transform`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/svg/transform.ts tests/unit/svg.transform.test.ts
git commit -m "feat(svg): add applyCustomize transform with solid/gradient modes"
```

---

## Task 4: `utils/svg/validate.ts` — `parseUploadInput`

**Spec:** §7.2.

**Files:**

- Create: `utils/svg/validate.ts` (1차)
- Test: `tests/unit/svg.validate.test.ts` (1차)

- [ ] **Step 1: 실패 테스트 작성**

````ts
// tests/unit/svg.validate.test.ts
import { describe, it, expect } from 'vitest';
import { parseUploadInput } from '~/utils/svg/validate';

describe('parseUploadInput', () => {
  it('strips ```json code fences', () => {
    const input = '```json\n{"name":"X","tags":["a"],"category":"c","svg":"<svg/>"}\n```';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('<svg/>');
    expect(r.meta?.name).toBe('X');
    expect(r.meta?.tags).toEqual(['a']);
    expect(r.meta?.category).toBe('c');
  });

  it('parses bare JSON payload', () => {
    const input = '{"name":"Y","tags":["b"],"category":"d","svg":"<svg/>"}';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('<svg/>');
    expect(r.meta?.name).toBe('Y');
  });

  it('extracts <svg>...</svg> when input is not JSON', () => {
    const input =
      'Sure, here is your icon:\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>\nLet me know if...';
    const r = parseUploadInput(input);
    expect(r.svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(r.meta).toBeNull();
  });

  it('returns trimmed input as svg when no <svg> tag matched and no JSON', () => {
    const input = '   not really svg   ';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('not really svg');
    expect(r.meta).toBeNull();
  });
});
````

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- svg.validate`
Expected: FAIL — `Cannot find module '~/utils/svg/validate'`.

- [ ] **Step 3: `utils/svg/validate.ts` 1차 구현 (parseUploadInput만)**

````ts
// utils/svg/validate.ts
export type IconMeta = { name: string; tags: string[]; category: string };
export type ParsedUpload = { svg: string; meta: Partial<IconMeta> | null };

const CODE_FENCE_RE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
const SVG_RE = /<svg[\s\S]*?<\/svg>/i;

export function parseUploadInput(raw: string): ParsedUpload {
  let s = raw.trim();
  const fenceMatch = s.match(CODE_FENCE_RE);
  if (fenceMatch) s = fenceMatch[1].trim();

  if (s.startsWith('{')) {
    try {
      const j = JSON.parse(s);
      if (j && typeof j === 'object' && typeof j.svg === 'string') {
        return {
          svg: j.svg,
          meta: {
            name: typeof j.name === 'string' ? j.name : undefined,
            tags: Array.isArray(j.tags)
              ? j.tags.filter((t: unknown): t is string => typeof t === 'string')
              : undefined,
            category: typeof j.category === 'string' ? j.category : undefined,
          },
        };
      }
    } catch {
      /* fallthrough */
    }
  }

  const svgMatch = s.match(SVG_RE);
  return { svg: svgMatch ? svgMatch[0] : s, meta: null };
}
````

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- svg.validate`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/svg/validate.ts tests/unit/svg.validate.test.ts
git commit -m "feat(svg): parse upload input (code-fence strip / json / svg fallback)"
```

---

## Task 5: `validateAndNormalizeSvg` — 표준 검증 + 정규화

**Spec:** §4.1, §7.3.

**Files:**

- Modify: `utils/svg/validate.ts`
- Modify: `tests/unit/svg.validate.test.ts`
- Create: `tests/fixtures/svg/valid/cloud.svg`
- Create: `tests/fixtures/svg/invalid/wrong-viewbox.svg`
- Create: `tests/fixtures/svg/invalid/bad-color.svg`
- Create: `tests/fixtures/svg/invalid/forbidden-node.svg`
- Create: `tests/fixtures/svg/invalid/inline-script.svg`

- [ ] **Step 1: 픽스처 생성**

Create: `tests/fixtures/svg/valid/cloud.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 5 12.5 4.5 4.5 0 0 0 6.5 21h11Z"/></svg>
```

Create: `tests/fixtures/svg/invalid/wrong-viewbox.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor"><path d="M0 0L32 32"/></svg>
```

Create: `tests/fixtures/svg/invalid/bad-color.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1E88E5"><path d="M0 0"/></svg>
```

Create: `tests/fixtures/svg/invalid/forbidden-node.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><defs><linearGradient id="g"><stop offset="0%" stop-color="#000"/></linearGradient></defs><path d="M0 0" stroke="url(#g)"/></svg>
```

Create: `tests/fixtures/svg/invalid/inline-script.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><script>alert(1)</script><path d="M0 0"/></svg>
```

- [ ] **Step 2: 실패 테스트 추가**

Append to `tests/unit/svg.validate.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateAndNormalizeSvg } from '~/utils/svg/validate';

const fix = (rel: string) => readFileSync(resolve(__dirname, '..', 'fixtures', 'svg', rel), 'utf8');

describe('validateAndNormalizeSvg', () => {
  it('accepts a valid Feather-style svg and emits canonical root attrs', () => {
    const r = validateAndNormalizeSvg(fix('valid/cloud.svg'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(r.svg).toContain('viewBox="0 0 24 24"');
      expect(r.svg).toContain('stroke="currentColor"');
      expect(r.svg).toContain('stroke-linecap="round"');
      expect(r.svg).toContain('stroke-linejoin="round"');
      expect(r.svg).toContain('<path');
    }
  });

  it('rejects when viewBox is not "0 0 24 24"', () => {
    const r = validateAndNormalizeSvg(fix('invalid/wrong-viewbox.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some(e => e.toLowerCase().includes('viewbox'))).toBe(true);
  });

  it('rejects hex color in fill/stroke', () => {
    const r = validateAndNormalizeSvg(fix('invalid/bad-color.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some(e => e.toLowerCase().includes('color'))).toBe(true);
  });

  it('rejects forbidden nodes (<linearGradient>)', () => {
    const r = validateAndNormalizeSvg(fix('invalid/forbidden-node.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/forbidden|lineargradient/i);
  });

  it('rejects <script>', () => {
    const r = validateAndNormalizeSvg(fix('invalid/inline-script.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/script/i);
  });

  it('rejects payload over 50KB', () => {
    const big =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="' +
      'M'.repeat(60_000) +
      '"/></svg>';
    const r = validateAndNormalizeSvg(big);
    expect(r.ok).toBe(false);
  });

  it('flattens <g> wrappers', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><g><path d="M0 0L24 24"/></g></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.svg).not.toContain('<g');
      expect(r.svg).toContain('<path');
    }
  });

  it('strips on* event handlers (rejects)', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M0 0" onclick="x()"/></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ').toLowerCase()).toContain('onclick');
  });

  it('rejects empty input', () => {
    const r = validateAndNormalizeSvg('   ');
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm test -- svg.validate`
Expected: 새 테스트들 FAIL (`validateAndNormalizeSvg is not a function`).

- [ ] **Step 4: `validateAndNormalizeSvg` 구현**

Append to `utils/svg/validate.ts`:

```ts
import { XMLParser } from 'fast-xml-parser';

export type ValidationResult = { ok: true; svg: string } | { ok: false; errors: string[] };

const MAX_PAYLOAD = 50_000;
const MIN_SHAPES = 1;
const MAX_SHAPES = 30;

const ALLOWED_NODES = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const FORBIDDEN_NODES = new Set([
  'script',
  'foreignObject',
  'iframe',
  'style',
  'a',
  'use',
  'image',
  'defs',
  'linearGradient',
  'radialGradient',
  'pattern',
  'mask',
  'clipPath',
  'filter',
]);
const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color']);
const ALLOWED_COLOR_VALUES = new Set(['none', 'currentColor']);

const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  path: new Set([
    'd',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'fill-rule',
    'clip-rule',
  ]),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width']),
  line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'stroke-linecap']),
  polyline: new Set([
    'points',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
  ]),
  polygon: new Set([
    'points',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
  ]),
  ellipse: new Set(['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width']),
};

const CANONICAL_ROOT_ATTRS: Array<[string, string]> = [
  ['xmlns', 'http://www.w3.org/2000/svg'],
  ['viewBox', '0 0 24 24'],
  ['fill', 'none'],
  ['stroke', 'currentColor'],
  ['stroke-width', '2'],
  ['stroke-linecap', 'round'],
  ['stroke-linejoin', 'round'],
];

type FlatShape = { tag: string; attrs: Record<string, string> };

function escapeXml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeAttrs(node: any): Record<string, string> {
  const out: Record<string, string> = {};
  const a = node[':@'];
  if (a) {
    for (const [k, v] of Object.entries(a)) {
      if (k.startsWith('@_')) out[k.slice(2)] = String(v);
    }
  }
  return out;
}

function findRoot(tree: any[]): any | null {
  for (const node of tree) {
    if (Object.prototype.hasOwnProperty.call(node, 'svg')) return node;
  }
  return null;
}

export function validateAndNormalizeSvg(input: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = input.trim();
  if (trimmed.length === 0) return { ok: false, errors: ['SVG is empty'] };
  if (trimmed.length > MAX_PAYLOAD) {
    return { ok: false, errors: [`SVG exceeds ${MAX_PAYLOAD} bytes (got ${trimmed.length})`] };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    parseAttributeValue: false,
    trimValues: true,
  });
  let tree: any[];
  try {
    tree = parser.parse(trimmed);
  } catch (e: any) {
    return { ok: false, errors: ['SVG XML parse error: ' + (e?.message ?? 'unknown')] };
  }

  const root = findRoot(tree);
  if (!root) return { ok: false, errors: ['Root <svg> not found'] };

  const rootAttrs = nodeAttrs(root);
  if (rootAttrs.viewBox !== '0 0 24 24') {
    errors.push(`viewBox must be "0 0 24 24" (found "${rootAttrs.viewBox ?? ''}")`);
  }

  const flat: FlatShape[] = [];
  const walk = (children: any[]) => {
    for (const node of children) {
      const tag = Object.keys(node).find(k => k !== ':@');
      if (!tag) continue;
      const attrs = nodeAttrs(node);
      if (FORBIDDEN_NODES.has(tag)) {
        errors.push(`Forbidden node: <${tag}>`);
        continue;
      }
      if (tag === 'g') {
        const inner = node[tag];
        if (Array.isArray(inner)) walk(inner);
        continue;
      }
      if (!ALLOWED_NODES.has(tag)) {
        errors.push(`Unsupported node: <${tag}>`);
        continue;
      }

      for (const [name, value] of Object.entries(attrs)) {
        if (name.startsWith('on')) {
          errors.push(`Forbidden event handler attribute: ${name}`);
          continue;
        }
        if (name === 'style') {
          errors.push('Inline "style" attribute is not allowed');
          continue;
        }
        if (name === 'href' || name === 'xlink:href') {
          if (!/^#/.test(value)) {
            errors.push(`External href is not allowed: ${name}="${value}"`);
            continue;
          }
        }
        if (COLOR_ATTRS.has(name)) {
          if (!ALLOWED_COLOR_VALUES.has(value)) {
            errors.push(`Color must be currentColor or none: ${name}="${value}"`);
            continue;
          }
        }
      }
      flat.push({ tag, attrs });
    }
  };
  walk(Array.isArray(root.svg) ? root.svg : []);

  if (flat.length < MIN_SHAPES) errors.push(`At least ${MIN_SHAPES} shape required`);
  if (flat.length > MAX_SHAPES) {
    errors.push(`Too many shapes (max ${MAX_SHAPES}, got ${flat.length})`);
  }

  if (errors.length > 0) return { ok: false, errors };

  const normalized: FlatShape[] = [];
  for (const c of flat) {
    const allow = ALLOWED_ATTRS_BY_TAG[c.tag];
    const kept: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.attrs)) {
      if (!allow.has(k)) continue;
      if (k === 'd' && (!v || v.trim() === '')) continue;
      kept[k] = v;
    }
    if (c.tag === 'path' && !('d' in kept)) continue;
    normalized.push({ tag: c.tag, attrs: kept });
  }

  const rootOpen = '<svg' + CANONICAL_ROOT_ATTRS.map(([k, v]) => ` ${k}="${v}"`).join('') + '>';
  const body = normalized
    .map(c => {
      const a = Object.entries(c.attrs)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join('');
      return `<${c.tag}${a}/>`;
    })
    .join('');
  return { ok: true, svg: `${rootOpen}${body}</svg>` };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test -- svg.validate`
Expected: 모든 테스트 passed.

- [ ] **Step 6: Commit**

```bash
git add utils/svg/validate.ts tests/unit/svg.validate.test.ts tests/fixtures/svg
git commit -m "feat(svg): add validateAndNormalizeSvg with strict whitelist"
```

---

## Task 6: `validateMeta` + `makeSlug`

**Spec:** §5.4, §7.4.

**Files:**

- Modify: `utils/svg/validate.ts`
- Modify: `tests/unit/svg.validate.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

Append to `tests/unit/svg.validate.test.ts`:

```ts
import { validateMeta, makeSlug } from '~/utils/svg/validate';

describe('validateMeta', () => {
  it('accepts valid meta', () => {
    const r = validateMeta({ name: 'AWS Cloud', tags: ['aws', 'cloud'], category: 'cloud' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.meta.name).toBe('AWS Cloud');
      expect(r.meta.tags).toEqual(['aws', 'cloud']);
      expect(r.meta.category).toBe('cloud');
    }
  });

  it('rejects empty name', () => {
    const r = validateMeta({ name: '   ', tags: [], category: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects name longer than 64 chars', () => {
    const r = validateMeta({ name: 'a'.repeat(65), tags: [], category: '' });
    expect(r.ok).toBe(false);
  });

  it('lowercases tags and dedupes', () => {
    const r = validateMeta({ name: 'X', tags: ['AWS', 'aws', 'Cloud'], category: '' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.meta.tags).toEqual(['aws', 'cloud']);
  });

  it('rejects too many tags', () => {
    const r = validateMeta({
      name: 'X',
      tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
      category: '',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects category over 30 chars', () => {
    const r = validateMeta({ name: 'X', tags: [], category: 'a'.repeat(31) });
    expect(r.ok).toBe(false);
  });
});

describe('makeSlug', () => {
  it('lowercases and hyphens basic ascii', () => {
    expect(makeSlug('AWS Cloud Storage')).toBe('aws-cloud-storage');
  });

  it('strips disallowed chars', () => {
    expect(makeSlug('Hello, World!')).toBe('hello-world');
  });

  it('falls back to icon-<nanoid> for korean-only name', () => {
    const s = makeSlug('한국어 이름');
    expect(s).toMatch(/^icon-[a-z0-9_-]{6}$/i);
  });

  it('collapses consecutive hyphens', () => {
    expect(makeSlug('foo --- bar')).toBe('foo-bar');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- svg.validate`
Expected: 새 테스트들 FAIL.

- [ ] **Step 3: 구현 추가**

Append to `utils/svg/validate.ts`:

```ts
import { customAlphabet } from 'nanoid';

const NANO = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export type MetaInput = { name?: string; tags?: string[]; category?: string };
export type MetaResult = { ok: true; meta: IconMeta } | { ok: false; errors: string[] };

export function validateMeta(input: MetaInput): MetaResult {
  const errors: string[] = [];
  const name = (input.name ?? '').trim();
  if (name.length === 0) errors.push('name is required');
  if (name.length > 64) errors.push('name must be 64 chars or fewer');

  const tagsRaw = Array.isArray(input.tags) ? input.tags : [];
  const tagsLower = tagsRaw
    .map(t => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter(t => t.length > 0 && t.length <= 30);
  const tags = Array.from(new Set(tagsLower));
  if (tags.length > 20) errors.push('too many tags (max 20)');

  const category = (input.category ?? '').trim();
  if (category.length > 30) errors.push('category must be 30 chars or fewer');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, meta: { name, tags, category } };
}

export function makeSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) return `icon-${NANO()}`;
  return slug;
}

export function makeFallbackSlug(base: string): string {
  return `${base}-${NANO()}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test`
Expected: 모든 테스트 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/svg/validate.ts tests/unit/svg.validate.test.ts
git commit -m "feat(svg): add validateMeta and makeSlug with nanoid fallback"
```

---

## Task 7: `utils/download.ts`

**Spec:** §8.3.

**Files:**

- Create: `utils/download.ts`

- [ ] **Step 1: 파일 작성**

```ts
// utils/download.ts
export function downloadSvg(slug: string, svgText: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add utils/download.ts
git commit -m "feat: add downloadSvg helper"
```

---

## Task 8: `composables/promptGuide.ts`

**Spec:** §7.1.

**Files:**

- Create: `composables/promptGuide.ts`

- [ ] **Step 1: 파일 작성**

```ts
// composables/promptGuide.ts
export const PROMPT_GUIDE_TEMPLATE =
  `You are an SVG icon generator. Output ONLY a single JSON object that matches the schema below. No prose, no code fences, no explanations.

KEYWORD: <KEYWORD>

SCHEMA:
{
  "name": string,                   // 1~64자, 화면 표시용 (한글 또는 영문)
  "tags": string[],                 // 3~8개, 검색용 키워드
  "category": string,               // 0~30자, 자유 분류
  "svg": string                     // 아래 SVG 규칙을 정확히 따른 SVG XML 문자열
}

SVG RULES (모두 준수):
1. 루트는 단일 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">.
2. viewBox는 "0 0 24 24" 고정. width/height 속성 두지 마라.
3. 색상은 오직 "currentColor" 만 허용. 임의 hex/named color, rgb(), hsl() 금지.
4. 채움이 필요한 도형은 그 도형 자체에 fill="currentColor" 명시. 그 외에는 fill 속성 두지 마라.
5. <defs>, <linearGradient>, <radialGradient>, <pattern>, <mask>, <clipPath>, <filter>, <use>, <image> 사용 금지.
6. <script>, <foreignObject>, <iframe>, <a>, <style>, on* 이벤트 핸들러, xlink:href 의 외부 URL 사용 금지.
7. inline style 속성(style="...") 금지. 모든 속성을 직접 명시하라.
8. 도형 종류는 <path>, <circle>, <rect>, <line>, <polyline>, <polygon>, <ellipse> 만.
9. 도형 수는 1~30개 사이. 24×24 그리드 안에서 시각적 균형을 잡아라.
10. 출력에 \`\`\`json 같은 코드펜스를 두지 마라. 순수 JSON 한 덩어리만 출력.

EXAMPLE (참고용, KEYWORD과 무관):
{
  "name": "Cloud",
  "tags": ["cloud", "weather", "storage"],
  "category": "system",
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 5 12.5 4.5 4.5 0 0 0 6.5 21h11Z\\"/></svg>"
}
` as const;

export function buildPrompt(topic: string): string {
  const safeTopic = topic.trim().length > 0 ? topic.trim() : '(주제를 입력하세요)';
  return PROMPT_GUIDE_TEMPLATE.replace('<KEYWORD>', safeTopic);
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/promptGuide.ts
git commit -m "feat: add prompt guide template and buildPrompt"
```

---

## Task 9: `server/utils/db.ts` — DB 인스턴스 + 마이그레이션 SQL

**Spec:** §5.1, §5.2.

**Files:**

- Create: `server/utils/db.ts`

- [ ] **Step 1: 파일 작성**

```ts
// server/utils/db.ts
import Database from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

let _db: Database.Database | null = null;

export type Db = Database.Database;

export function getDb(): Db {
  if (_db) return _db;
  const path = process.env.DB_PATH ?? './data/icons.db';
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  _db = db;
  return db;
}

export const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS icons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  category    TEXT    NOT NULL DEFAULT '',
  tags_json   TEXT    NOT NULL DEFAULT '[]',
  tags_text   TEXT    NOT NULL DEFAULT '',
  svg         TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_icons_created_at ON icons(created_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS icons_fts USING fts5(
  name, tags, category,
  content='icons', content_rowid='id',
  tokenize='trigram'
);

CREATE TRIGGER IF NOT EXISTS icons_ai AFTER INSERT ON icons BEGIN
  INSERT INTO icons_fts(rowid, name, tags, category)
  VALUES (new.id, new.name, new.tags_text, new.category);
END;

CREATE TRIGGER IF NOT EXISTS icons_ad AFTER DELETE ON icons BEGIN
  INSERT INTO icons_fts(icons_fts, rowid, name, tags, category)
  VALUES ('delete', old.id, old.name, old.tags_text, old.category);
END;

CREATE TRIGGER IF NOT EXISTS icons_au AFTER UPDATE ON icons BEGIN
  INSERT INTO icons_fts(icons_fts, rowid, name, tags, category)
  VALUES ('delete', old.id, old.name, old.tags_text, old.category);
  INSERT INTO icons_fts(rowid, name, tags, category)
  VALUES (new.id, new.name, new.tags_text, new.category);
END;
`;

export function runMigrations(db: Db): void {
  db.exec(MIGRATIONS_SQL);
}

export function assertFts5(db: Db): void {
  // Will throw if FTS5 is unavailable.
  db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'icons_fts'").get();
}

export function resetDbForTests(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/utils/db.ts
git commit -m "feat(db): add sqlite connection and migrations"
```

---

## Task 10: `server/plugins/db.ts` — 부팅 시 마이그레이션

**Spec:** §5.1.

**Files:**

- Create: `server/plugins/db.ts`

- [ ] **Step 1: 파일 작성**

```ts
// server/plugins/db.ts
import { getDb, runMigrations, assertFts5 } from '~/server/utils/db';

export default defineNitroPlugin(() => {
  const db = getDb();
  runMigrations(db);
  assertFts5(db);
  // eslint-disable-next-line no-console
  console.log('[incoassets] sqlite ready');
});
```

- [ ] **Step 2: Commit**

```bash
git add server/plugins/db.ts
git commit -m "feat(db): run migrations on nitro startup"
```

---

## Task 11: `server/utils/repo/icons.ts` — repo 함수

**Spec:** §5.3, §5.4, §6.2.

**Files:**

- Create: `server/utils/repo/icons.ts`
- Test: `tests/api/icons.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/api/icons.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

let tmp: string;
beforeEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = mkdtempSync(join(tmpdir(), 'incoassets-'));
  process.env.DB_PATH = join(tmp, 'icons.db');
  // reset module cache so getDb re-creates with new path
});

describe('repo/icons', () => {
  it('inserts and retrieves an icon by listIcons', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const inserted = repo.insertIcon({
      name: 'AWS Cloud',
      slug: 'aws-cloud',
      category: 'cloud',
      tags: ['aws', 'cloud'],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
    });
    expect(inserted.id).toBeGreaterThan(0);
    expect(inserted.slug).toBe('aws-cloud');

    const list = repo.listIcons({ q: 'aws', offset: 0, limit: 10 });
    expect(list.items.length).toBe(1);
    expect(list.items[0].name).toBe('AWS Cloud');
    expect(list.hasMore).toBe(false);
  });

  it('retries slug on UNIQUE conflict', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const a = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    const b = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    expect(a.slug).toBe('x');
    expect(b.slug).toBe('x-2');
  });

  it('deleteIcon removes row and returns true', async () => {
    const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
    resetDbForTests();
    runMigrations(getDb());
    const repo = await import('~/server/utils/repo/icons');

    const ins = repo.insertIcon({ name: 'X', slug: 'x', category: '', tags: [], svg: '<svg/>' });
    expect(repo.deleteIcon(ins.id)).toBe(true);
    expect(repo.deleteIcon(ins.id)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- tests/api/icons.test.ts`
Expected: FAIL.

- [ ] **Step 3: 구현**

```ts
// server/utils/repo/icons.ts
import { getDb } from '~/server/utils/db';
import { customAlphabet } from 'nanoid';

const NANO = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export type IconRow = {
  id: number;
  name: string;
  slug: string;
  category: string;
  tagsJson: string;
  svg: string;
  createdAt: string;
};

export type InsertIconInput = {
  name: string;
  slug: string;
  category: string;
  tags: string[];
  svg: string;
};

type DbRow = {
  id: number;
  name: string;
  slug: string;
  category: string;
  tags_json: string;
  svg: string;
  created_at: string;
};

const COLUMNS = 'id, name, slug, category, tags_json, svg, created_at';

function row(r: DbRow): IconRow {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    tagsJson: r.tags_json,
    svg: r.svg,
    createdAt: r.created_at,
  };
}

function tryInsert(slug: string, input: InsertIconInput): number | null {
  const db = getDb();
  const tagsJson = JSON.stringify(input.tags);
  const tagsText = input.tags.join(' ');
  try {
    const info = db
      .prepare(
        'INSERT INTO icons (name, slug, category, tags_json, tags_text, svg) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(input.name, slug, input.category, tagsJson, tagsText, input.svg);
    return Number(info.lastInsertRowid);
  } catch (e: any) {
    if (
      typeof e?.message === 'string' &&
      e.message.includes('UNIQUE constraint failed: icons.slug')
    ) {
      return null;
    }
    throw e;
  }
}

export function insertIcon(input: InsertIconInput): IconRow {
  const db = getDb();
  const base = input.slug;
  const candidates = [base, `${base}-2`, `${base}-3`, `${base}-4`, `${base}-5`];
  let id: number | null = null;
  let used = base;
  for (const cand of candidates) {
    id = tryInsert(cand, input);
    if (id !== null) {
      used = cand;
      break;
    }
  }
  if (id === null) {
    used = `${base}-${NANO()}`;
    id = tryInsert(used, input);
    if (id === null) throw new Error('Unable to insert icon: slug exhausted');
  }
  const r = db.prepare(`SELECT ${COLUMNS} FROM icons WHERE id = ?`).get(id) as DbRow;
  return row(r);
}

function escapeFts(token: string): string {
  return '"' + token.replace(/"/g, '""') + '"';
}

function buildFtsQuery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => escapeFts(t) + '*')
    .join(' AND ');
}

export type ListInput = { q?: string; offset: number; limit: number };
export type ListResult = { items: IconRow[]; hasMore: boolean };

export function listIcons(input: ListInput): ListResult {
  const db = getDb();
  const limit = Math.max(1, Math.min(120, input.limit));
  const offset = Math.max(0, input.offset);
  const q = (input.q ?? '').trim();

  let rows: DbRow[];
  if (q.length > 0) {
    const fts = buildFtsQuery(q);
    rows = db
      .prepare(
        `SELECT ${COLUMNS.split(', ')
          .map(c => 'i.' + c)
          .join(', ')}
         FROM icons i
         JOIN icons_fts f ON f.rowid = i.id
         WHERE icons_fts MATCH ?
         ORDER BY rank, i.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(fts, limit + 1, offset) as DbRow[];
  } else {
    rows = db
      .prepare(`SELECT ${COLUMNS} FROM icons ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(limit + 1, offset) as DbRow[];
  }

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(row);
  return { items, hasMore };
}

export function deleteIcon(id: number): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM icons WHERE id = ?').run(id);
  return info.changes > 0;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- tests/api/icons.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add server/utils/repo/icons.ts tests/api/icons.test.ts
git commit -m "feat(db): add icons repo (insert/list/delete) with slug retry"
```

---

## Task 12: `POST /api/icons` — 업로드

**Spec:** §6.2, §7.

**Files:**

- Create: `server/api/icons/index.post.ts`

- [ ] **Step 1: 파일 작성**

```ts
// server/api/icons/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';
import {
  parseUploadInput,
  validateAndNormalizeSvg,
  validateMeta,
  makeSlug,
} from '~/utils/svg/validate';
import { insertIcon } from '~/server/utils/repo/icons';

const BodySchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).default([]),
  category: z.string().default(''),
  svg: z.string(),
});

export default defineEventHandler(async event => {
  const raw = await readBody(event);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
    });
  }

  const meta = validateMeta({
    name: parsed.data.name,
    tags: parsed.data.tags,
    category: parsed.data.category,
  });
  if (!meta.ok) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: meta.errors.join('; ') } },
    });
  }

  const upload = parseUploadInput(parsed.data.svg);
  const svgValidation = validateAndNormalizeSvg(upload.svg);
  if (!svgValidation.ok) {
    throw createError({
      statusCode: 400,
      data: {
        error: {
          code: 'INVALID_SVG',
          message: svgValidation.errors.join('; '),
        },
      },
    });
  }

  const slug = makeSlug(meta.meta.name);
  const inserted = insertIcon({
    name: meta.meta.name,
    slug,
    category: meta.meta.category,
    tags: meta.meta.tags,
    svg: svgValidation.svg,
  });

  return {
    id: inserted.id,
    name: inserted.name,
    slug: inserted.slug,
    category: inserted.category,
    tags: JSON.parse(inserted.tagsJson),
    svg: inserted.svg,
    createdAt: inserted.createdAt,
  };
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/icons/index.post.ts
git commit -m "feat(api): POST /api/icons (upload) with strict svg validation"
```

---

## Task 13: `GET /api/icons` — 검색·목록

**Spec:** §6.2.

**Files:**

- Create: `server/api/icons/index.get.ts`

- [ ] **Step 1: 파일 작성**

```ts
// server/api/icons/index.get.ts
import { defineEventHandler, getQuery } from 'h3';
import { listIcons } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const q = getQuery(event);
  const offset = Number.parseInt(typeof q.offset === 'string' ? q.offset : '0', 10) || 0;
  const limit = Number.parseInt(typeof q.limit === 'string' ? q.limit : '60', 10) || 60;
  const search = typeof q.q === 'string' ? q.q : '';

  const result = listIcons({ q: search, offset, limit });
  return {
    items: result.items.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      tags: JSON.parse(r.tagsJson),
      svg: r.svg,
      createdAt: r.createdAt,
    })),
    hasMore: result.hasMore,
  };
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/icons/index.get.ts
git commit -m "feat(api): GET /api/icons (search/list with FTS5)"
```

---

## Task 14: `DELETE /api/icons/:id` — 삭제

**Spec:** §6.2.

**Files:**

- Create: `server/api/icons/[id].delete.ts`

- [ ] **Step 1: 파일 작성**

```ts
// server/api/icons/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { deleteIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const idParam = getRouterParam(event, 'id') ?? '';
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'invalid id' } },
    });
  }
  const ok = deleteIcon(id);
  if (!ok) {
    throw createError({
      statusCode: 404,
      data: { error: { code: 'NOT_FOUND', message: 'icon not found' } },
    });
  }
  return { ok: true };
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/icons/[id].delete.ts
git commit -m "feat(api): DELETE /api/icons/:id"
```

---

## Task 15: `stores/customize.ts` — Pinia store

**Spec:** §3.7.

**Files:**

- Create: `stores/customize.ts`

- [ ] **Step 1: 파일 작성**

```ts
// stores/customize.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ColorMode = 'solid' | 'gradient';

const DEFAULTS = {
  size: 24,
  strokeWidth: 2,
  mode: 'solid' as ColorMode,
  solidColor: '#1F2937',
  gradientStart: '#1F2937',
  gradientEnd: '#3B82F6',
  gradientAngle: 90,
};

export const useCustomize = defineStore('customize', () => {
  const size = ref<number>(DEFAULTS.size);
  const strokeWidth = ref<number>(DEFAULTS.strokeWidth);
  const mode = ref<ColorMode>(DEFAULTS.mode);
  const solidColor = ref<string>(DEFAULTS.solidColor);
  const gradientStart = ref<string>(DEFAULTS.gradientStart);
  const gradientEnd = ref<string>(DEFAULTS.gradientEnd);
  const gradientAngle = ref<number>(DEFAULTS.gradientAngle);

  function reset() {
    size.value = DEFAULTS.size;
    strokeWidth.value = DEFAULTS.strokeWidth;
    mode.value = DEFAULTS.mode;
    solidColor.value = DEFAULTS.solidColor;
    gradientStart.value = DEFAULTS.gradientStart;
    gradientEnd.value = DEFAULTS.gradientEnd;
    gradientAngle.value = DEFAULTS.gradientAngle;
  }

  return {
    size,
    strokeWidth,
    mode,
    solidColor,
    gradientStart,
    gradientEnd,
    gradientAngle,
    reset,
  };
});
```

- [ ] **Step 2: Commit**

```bash
git add stores/customize.ts
git commit -m "feat(store): add customize store"
```

---

## Task 16: `stores/search.ts` — 검색·페이징 + API 호출

**Spec:** §3.5, §3.6, §6.2, §9.1.

**Files:**

- Create: `stores/search.ts`

- [ ] **Step 1: 파일 작성**

```ts
// stores/search.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type IconDto = {
  id: number;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  svg: string;
  createdAt: string;
};

const PAGE_SIZE = 60;

export const useSearch = defineStore('search', () => {
  const q = ref<string>('');
  const items = ref<IconDto[]>([]);
  const offset = ref<number>(0);
  const hasMore = ref<boolean>(true);
  const loading = ref<boolean>(false);
  let abortCtrl: AbortController | null = null;

  async function fetchPage(reset: boolean) {
    if (loading.value) return;
    if (!reset && !hasMore.value) return;
    loading.value = true;
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const url = new URL('/api/icons', window.location.origin);
    if (q.value) url.searchParams.set('q', q.value);
    url.searchParams.set('offset', String(reset ? 0 : offset.value));
    url.searchParams.set('limit', String(PAGE_SIZE));
    try {
      const res = await fetch(url, { signal: abortCtrl.signal });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: IconDto[]; hasMore: boolean };
      if (reset) {
        items.value = json.items;
        offset.value = json.items.length;
      } else {
        items.value = [...items.value, ...json.items];
        offset.value = items.value.length;
      }
      hasMore.value = json.hasMore;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error('[search] fetch error', e);
      }
    } finally {
      loading.value = false;
    }
  }

  async function setQuery(next: string) {
    q.value = next;
    offset.value = 0;
    hasMore.value = true;
    await fetchPage(true);
  }

  async function loadMore() {
    await fetchPage(false);
  }

  function add(item: IconDto) {
    items.value = [item, ...items.value];
    offset.value += 1;
  }

  function remove(id: number) {
    items.value = items.value.filter(i => i.id !== id);
    offset.value = Math.max(0, offset.value - 1);
  }

  return { q, items, offset, hasMore, loading, setQuery, loadMore, add, remove };
});
```

- [ ] **Step 2: Commit**

```bash
git add stores/search.ts
git commit -m "feat(store): add search store with infinite scroll"
```

---

## Task 17: `components/CustomizePanel.vue`

**Spec:** §3.7.

**Files:**

- Create: `components/CustomizePanel.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/CustomizePanel.vue -->
<script setup lang="ts">
import { useCustomize } from '~/stores/customize';

const c = useCustomize();
</script>

<template>
  <aside
    class="sticky top-20 w-full max-w-xs self-start rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold">Customize</h2>
      <button
        type="button"
        class="rounded border px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
        @click="c.reset()">
        Reset
      </button>
    </div>

    <div class="mb-4">
      <div class="mb-1 flex items-center justify-between text-sm">
        <label for="cz-size">Size</label>
        <span class="text-zinc-500">{{ c.size }}px</span>
      </div>
      <input
        id="cz-size"
        v-model.number="c.size"
        type="range"
        min="16"
        max="64"
        step="1"
        class="w-full" />
    </div>

    <div class="mb-4">
      <div class="mb-1 flex items-center justify-between text-sm">
        <label for="cz-stroke">Stroke width</label>
        <span class="text-zinc-500">{{ c.strokeWidth }}px</span>
      </div>
      <input
        id="cz-stroke"
        v-model.number="c.strokeWidth"
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        class="w-full" />
    </div>

    <div class="mb-4">
      <div class="mb-1 text-sm">Color</div>
      <div class="inline-flex rounded border p-0.5 text-xs">
        <button
          type="button"
          class="rounded px-3 py-1"
          :class="
            c.mode === 'solid' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''
          "
          @click="c.mode = 'solid'">
          Solid
        </button>
        <button
          type="button"
          class="rounded px-3 py-1"
          :class="
            c.mode === 'gradient' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''
          "
          @click="c.mode = 'gradient'">
          Gradient
        </button>
      </div>
    </div>

    <div v-if="c.mode === 'solid'" class="space-y-2">
      <div class="flex items-center gap-2">
        <input v-model="c.solidColor" type="color" class="h-8 w-10 cursor-pointer rounded border" />
        <input v-model="c.solidColor" type="text" class="flex-1 rounded border px-2 py-1 text-sm" />
      </div>
    </div>

    <div v-else class="space-y-3">
      <div>
        <div class="mb-1 text-xs">Start</div>
        <div class="flex items-center gap-2">
          <input
            v-model="c.gradientStart"
            type="color"
            class="h-8 w-10 cursor-pointer rounded border" />
          <input
            v-model="c.gradientStart"
            type="text"
            class="flex-1 rounded border px-2 py-1 text-sm" />
        </div>
      </div>
      <div>
        <div class="mb-1 text-xs">End</div>
        <div class="flex items-center gap-2">
          <input
            v-model="c.gradientEnd"
            type="color"
            class="h-8 w-10 cursor-pointer rounded border" />
          <input
            v-model="c.gradientEnd"
            type="text"
            class="flex-1 rounded border px-2 py-1 text-sm" />
        </div>
      </div>
      <div>
        <div class="mb-1 flex items-center justify-between text-xs">
          <label for="cz-angle">Angle</label>
          <span class="text-zinc-500">{{ c.gradientAngle }}°</span>
        </div>
        <input
          id="cz-angle"
          v-model.number="c.gradientAngle"
          type="range"
          min="0"
          max="360"
          step="1"
          class="w-full" />
      </div>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/CustomizePanel.vue
git commit -m "feat(ui): add CustomizePanel"
```

---

## Task 18: `components/IconCard.vue`

**Spec:** §3.6.2, §8.

**Files:**

- Create: `components/IconCard.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/IconCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useCustomize } from '~/stores/customize';
import { useSearch, type IconDto } from '~/stores/search';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';
import { downloadSvg } from '~/utils/download';

const props = defineProps<{ icon: IconDto }>();
const c = useCustomize();
const search = useSearch();

const state = computed<CustomizeState>(() => {
  if (c.mode === 'solid') {
    return {
      size: c.size,
      strokeWidth: c.strokeWidth,
      mode: 'solid',
      colors: { color: c.solidColor },
    };
  }
  return {
    size: c.size,
    strokeWidth: c.strokeWidth,
    mode: 'gradient',
    colors: { start: c.gradientStart, end: c.gradientEnd, angle: c.gradientAngle },
  };
});

const previewSvg = computed(() => applyCustomize(props.icon.svg, state.value));

function onCardClick() {
  downloadSvg(props.icon.slug, applyCustomize(props.icon.svg, state.value));
}

async function onDelete(e: MouseEvent) {
  e.stopPropagation();
  if (!window.confirm(`삭제할까요? "${props.icon.name}"`)) return;
  const res = await fetch(`/api/icons/${props.icon.id}`, { method: 'DELETE' });
  if (res.ok) search.remove(props.icon.id);
}
</script>

<template>
  <button
    type="button"
    class="group relative aspect-square rounded-lg border bg-white p-3 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    :title="icon.name"
    @click="onCardClick">
    <button
      type="button"
      class="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-red-600 group-hover:flex dark:hover:bg-zinc-800"
      :aria-label="`${icon.name} 삭제`"
      @click.stop="onDelete($event)">
      ×
    </button>
    <div
      class="flex h-full w-full items-center justify-center text-zinc-800 dark:text-zinc-100"
      v-html="previewSvg" />
    <div class="mt-2 truncate text-center text-xs text-zinc-500">{{ icon.name }}</div>
  </button>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/IconCard.vue
git commit -m "feat(ui): add IconCard with live preview/download/delete"
```

---

## Task 19: `components/IconCreateCard.vue`

**Spec:** §3.6.1.

**Files:**

- Create: `components/IconCreateCard.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/IconCreateCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useSearch } from '~/stores/search';

const search = useSearch();
const emit = defineEmits<{ open: [] }>();

const label = computed(() =>
  search.q.trim().length > 0 ? `+ "${search.q}" 업로드` : '+ 새 아이콘 업로드'
);
</script>

<template>
  <button
    type="button"
    class="aspect-square rounded-lg border-2 border-dashed bg-zinc-50 p-3 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:text-zinc-200"
    @click="emit('open')">
    <div class="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
      <span class="text-2xl leading-none">+</span>
      <span class="truncate text-xs">{{ label }}</span>
    </div>
  </button>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/IconCreateCard.vue
git commit -m "feat(ui): add IconCreateCard"
```

---

## Task 20: `components/IconGrid.vue` — 무한 스크롤

**Spec:** §3.6, §9.1.

**Files:**

- Create: `components/IconGrid.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/IconGrid.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useSearch } from '~/stores/search';
import IconCard from '~/components/IconCard.vue';
import IconCreateCard from '~/components/IconCreateCard.vue';

const emit = defineEmits<{ openCreate: [] }>();
const search = useSearch();
const sentinel = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  search.setQuery(search.q);
  observer = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting && search.hasMore && !search.loading) {
          search.loadMore();
        }
      }
    },
    { rootMargin: '200px' }
  );
  if (sentinel.value) observer.observe(sentinel.value);
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      <IconCreateCard @open="emit('openCreate')" />
      <IconCard v-for="icon in search.items" :key="icon.id" :icon="icon" />
    </div>

    <div
      v-if="search.items.length === 0 && !search.loading"
      class="mt-4 text-center text-sm text-zinc-500">
      검색 결과가 없습니다. 위 카드로 새로 등록해 보세요.
    </div>

    <div ref="sentinel" class="h-8" />
    <div v-if="search.loading" class="py-4 text-center text-sm text-zinc-500">로딩 중…</div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/IconGrid.vue
git commit -m "feat(ui): add IconGrid with infinite scroll"
```

---

## Task 21: `components/PromptGuidePanel.vue`

**Spec:** §3.8, §7.1.

**Files:**

- Create: `components/PromptGuidePanel.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/PromptGuidePanel.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { buildPrompt } from '~/composables/promptGuide';

const props = defineProps<{ topic: string }>();
const prompt = computed(() => buildPrompt(props.topic));
const copied = ref(false);

async function copy() {
  await navigator.clipboard.writeText(prompt.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">Prompt</h3>
      <button
        type="button"
        class="rounded border px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
        @click="copy">
        {{ copied ? '복사됨' : '📋 프롬프트 복사' }}
      </button>
    </div>
    <pre
      class="max-h-72 overflow-auto whitespace-pre-wrap rounded border bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900"
      >{{ prompt }}</pre
    >
    <p class="text-xs text-zinc-500">
      이 프롬프트를 본인 Claude/ChatGPT/Gemini에 붙여넣고, 결과 JSON 또는 SVG를 우측에 붙여넣어
      주세요.
    </p>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/PromptGuidePanel.vue
git commit -m "feat(ui): add PromptGuidePanel"
```

---

## Task 22: `components/UploadModal.vue`

**Spec:** §3.8, §7.

**Files:**

- Create: `components/UploadModal.vue`

- [ ] **Step 1: 파일 작성**

```vue
<!-- components/UploadModal.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCustomize } from '~/stores/customize';
import { useSearch, type IconDto } from '~/stores/search';
import { parseUploadInput, validateAndNormalizeSvg, validateMeta } from '~/utils/svg/validate';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';
import PromptGuidePanel from '~/components/PromptGuidePanel.vue';

const props = defineProps<{ open: boolean; topic: string }>();
const emit = defineEmits<{ close: []; saved: [IconDto] }>();

const search = useSearch();
const c = useCustomize();

type Tab = 'paste' | 'file';
const tab = ref<Tab>('paste');
const rawInput = ref<string>('');
const name = ref<string>('');
const tags = ref<string>('');
const category = ref<string>('');
const errors = ref<string[]>([]);
const submitting = ref(false);

const customizeState = computed<CustomizeState>(() => {
  if (c.mode === 'solid') {
    return {
      size: c.size,
      strokeWidth: c.strokeWidth,
      mode: 'solid',
      colors: { color: c.solidColor },
    };
  }
  return {
    size: c.size,
    strokeWidth: c.strokeWidth,
    mode: 'gradient',
    colors: { start: c.gradientStart, end: c.gradientEnd, angle: c.gradientAngle },
  };
});

const validated = computed(() => {
  if (!rawInput.value.trim()) return null;
  const parsed = parseUploadInput(rawInput.value);
  if (parsed.meta) {
    if (parsed.meta.name && !name.value) name.value = parsed.meta.name;
    if (parsed.meta.tags && !tags.value) tags.value = parsed.meta.tags.join(', ');
    if (parsed.meta.category !== undefined && !category.value)
      category.value = parsed.meta.category;
  }
  return validateAndNormalizeSvg(parsed.svg);
});

const previewSvg = computed(() => {
  if (!validated.value || !validated.value.ok) return '';
  return applyCustomize(validated.value.svg, customizeState.value);
});

const canSave = computed(() => {
  if (!validated.value || !validated.value.ok) return false;
  return name.value.trim().length > 0;
});

watch(
  () => props.topic,
  next => {
    if (props.open) name.value = next || '';
  }
);

watch(
  () => props.open,
  open => {
    if (open) {
      rawInput.value = '';
      name.value = props.topic || '';
      tags.value = '';
      category.value = '';
      errors.value = [];
      tab.value = 'paste';
    }
  }
);

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

async function save() {
  if (submitting.value) return;
  errors.value = [];
  if (!validated.value || !validated.value.ok) {
    errors.value =
      validated.value && !validated.value.ok ? validated.value.errors : ['SVG가 비어있습니다'];
    return;
  }
  const meta = validateMeta({
    name: name.value,
    tags: tags.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0),
    category: category.value,
  });
  if (!meta.ok) {
    errors.value = meta.errors;
    return;
  }
  submitting.value = true;
  try {
    const res = await fetch('/api/icons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: meta.meta.name,
        tags: meta.meta.tags,
        category: meta.meta.category,
        svg: validated.value.svg,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      errors.value = [j?.error?.message ?? `HTTP ${res.status}`];
      return;
    }
    const item = (await res.json()) as IconDto;
    search.add(item);
    emit('saved', item);
    emit('close');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="emit('close')">
    <div
      class="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-6 dark:bg-zinc-900">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">SVG 업로드</h2>
        <button
          class="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="emit('close')">
          ×
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PromptGuidePanel :topic="topic" />

        <div class="space-y-3">
          <div class="inline-flex rounded border p-0.5 text-xs">
            <button
              type="button"
              class="rounded px-3 py-1"
              :class="
                tab === 'paste' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''
              "
              @click="tab = 'paste'">
              Paste
            </button>
            <button
              type="button"
              class="rounded px-3 py-1"
              :class="
                tab === 'file' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : ''
              "
              @click="tab = 'file'">
              File
            </button>
          </div>

          <textarea
            v-if="tab === 'paste'"
            v-model="rawInput"
            class="h-48 w-full resize-none rounded border bg-white p-2 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
            placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ...>...</svg>  또는 JSON 페이로드' />
          <div
            v-else
            class="flex h-48 cursor-pointer items-center justify-center rounded border border-dashed text-sm text-zinc-500 dark:border-zinc-800"
            @dragover.prevent
            @drop="onDrop">
            <label class="cursor-pointer">
              <input type="file" accept="image/svg+xml,.svg" class="hidden" @change="onPickFile" />
              .svg 파일을 드래그하거나 클릭해서 선택
            </label>
          </div>

          <div
            v-if="validated && !validated.ok"
            class="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            <div class="font-semibold">INVALID_SVG</div>
            <ul class="ml-4 list-disc">
              <li v-for="e in validated.errors" :key="e">{{ e }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="my-6 rounded border bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div class="mb-2 text-xs text-zinc-500">미리보기 (Customize 패널 적용)</div>
        <div
          class="flex h-32 items-center justify-center text-zinc-800 dark:text-zinc-100"
          v-html="previewSvg" />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label class="text-sm">
          이름
          <input
            v-model="name"
            class="mt-1 w-full rounded border px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
        </label>
        <label class="text-sm">
          카테고리
          <input
            v-model="category"
            class="mt-1 w-full rounded border px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
        </label>
        <label class="text-sm md:col-span-2">
          태그 (쉼표 구분)
          <input
            v-model="tags"
            class="mt-1 w-full rounded border px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            placeholder="aws, cloud, server" />
        </label>
      </div>

      <div
        v-if="errors.length > 0"
        class="mt-3 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
        <ul class="ml-4 list-disc">
          <li v-for="e in errors" :key="e">{{ e }}</li>
        </ul>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded border px-3 py-1 text-sm" @click="emit('close')">취소</button>
        <button
          class="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          :disabled="!canSave || submitting"
          @click="save">
          {{ submitting ? '저장 중…' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/UploadModal.vue
git commit -m "feat(ui): add UploadModal with paste/file inputs and live validation"
```

---

## Task 23: `components/layouts/Header.vue` 수정

**Spec:** §3.3.

**Files:**

- Modify: `components/layouts/Header.vue`

- [ ] **Step 1: 기존 파일을 다음 내용으로 교체**

```vue
<!-- components/layouts/Header.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const dark = ref(false);

onMounted(() => {
  dark.value = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
});

watch(dark, v => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', v);
});
</script>

<template>
  <header class="border-b bg-white dark:border-zinc-800 dark:bg-zinc-950">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <a href="/" class="text-base font-semibold">incoassets</a>
      <button
        type="button"
        class="rounded border px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
        :aria-label="dark ? '라이트 모드' : '다크 모드'"
        @click="dark = !dark">
        {{ dark ? '☀︎' : '☾' }}
      </button>
    </div>
  </header>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/layouts/Header.vue
git commit -m "refactor(ui): simplify Header to logo + dark toggle"
```

---

## Task 24: `pages/index.vue` 메인 페이지 조립

**Spec:** §2, §3.

**Files:**

- Modify: `pages/index.vue`

- [ ] **Step 1: 기존 파일을 다음 내용으로 교체**

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Header from '~/components/layouts/Header.vue';
import IconGrid from '~/components/IconGrid.vue';
import CustomizePanel from '~/components/CustomizePanel.vue';
import UploadModal from '~/components/UploadModal.vue';
import { useSearch } from '~/stores/search';

const search = useSearch();
const inputQ = ref('');
const uploadOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
let debounce: ReturnType<typeof setTimeout> | null = null;

watch(inputQ, next => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    search.setQuery(next);
  }, 300);
});

function onOpenCreate() {
  uploadOpen.value = true;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !uploadOpen.value) {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName ?? '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <Header />
    <main class="mx-auto max-w-7xl px-4 py-10">
      <section class="mb-8 text-center">
        <h1 class="text-2xl font-semibold">사내 SVG 자산 라이브러리</h1>
        <p class="mt-1 text-sm text-zinc-500">
          검색하고 커스터마이즈하고 다운로드하세요. 없으면 외부 AI로 만들어 등록.
        </p>
      </section>

      <section class="mb-6">
        <input
          ref="searchInput"
          v-model="inputQ"
          type="search"
          placeholder='아이콘 검색…  ("/"로 포커스)'
          class="w-full rounded-lg border bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
      </section>

      <section class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <IconGrid @open-create="onOpenCreate" />
        </div>
        <CustomizePanel />
      </section>
    </main>

    <UploadModal
      :open="uploadOpen"
      :topic="search.q"
      @close="uploadOpen = false"
      @saved="uploadOpen = false" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add pages/index.vue
git commit -m "feat(page): assemble index with grid + customize + upload modal"
```

---

## Task 25: `tests/api/icons.test.ts` 보강 + 타입체크 + 빌드 검증

**Spec:** §10.

**Files:**

- Modify: `tests/api/icons.test.ts`

- [ ] **Step 1: FTS 검색 + offset 페이징 테스트 추가**

Append to `tests/api/icons.test.ts`:

```ts
it('list with q does FTS prefix match', async () => {
  const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
  resetDbForTests();
  runMigrations(getDb());
  const repo = await import('~/server/utils/repo/icons');
  repo.insertIcon({
    name: 'AWS Cloud',
    slug: 'aws-cloud',
    category: 'cloud',
    tags: ['aws', 'cloud'],
    svg: '<svg/>',
  });
  repo.insertIcon({
    name: 'Azure Disk',
    slug: 'azure-disk',
    category: 'cloud',
    tags: ['azure'],
    svg: '<svg/>',
  });
  const r = repo.listIcons({ q: 'aws', offset: 0, limit: 10 });
  expect(r.items.length).toBe(1);
  expect(r.items[0].name).toBe('AWS Cloud');
});

it('hasMore signals additional pages', async () => {
  const { getDb, runMigrations, resetDbForTests } = await import('~/server/utils/db');
  resetDbForTests();
  runMigrations(getDb());
  const repo = await import('~/server/utils/repo/icons');
  for (let i = 0; i < 3; i++) {
    repo.insertIcon({
      name: `Icon ${i}`,
      slug: `icon-${i}`,
      category: '',
      tags: [],
      svg: '<svg/>',
    });
  }
  const r = repo.listIcons({ offset: 0, limit: 2 });
  expect(r.items.length).toBe(2);
  expect(r.hasMore).toBe(true);

  const r2 = repo.listIcons({ offset: 2, limit: 2 });
  expect(r2.items.length).toBe(1);
  expect(r2.hasMore).toBe(false);
});
```

- [ ] **Step 2: 모든 테스트 실행**

Run: `pnpm test`
Expected: 모든 테스트 passed.

- [ ] **Step 3: 타입체크 + 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공. 타입 에러 없음.

- [ ] **Step 4: 수동 스모크 테스트 (개발 서버)**

Run: `pnpm dev` 후 브라우저에서 `http://localhost:3000` 접속:

- [ ] 빈 라이브러리에서 "+" 카드 보임 확인
- [ ] "+" 클릭 → 업로드 모달 열림
- [ ] 가이드의 EXAMPLE JSON을 그대로 붙여넣기 → 미리보기 표시 + 검증 통과
- [ ] 저장 → 그리드에 추가됨
- [ ] 우측 Customize 패널의 size/stroke/Solid·Gradient 변경 시 그리드 미리보기 실시간 반영
- [ ] 카드 클릭 → SVG 다운로드
- [ ] 카드 hover 시 × 보임 → 클릭 → confirm 후 삭제됨
- [ ] 검색바에 "cloud" 입력 → 디바운스 후 결과만 보임
- [ ] 검색어를 가지고 "+" 카드 라벨이 `+ "cloud" 업로드` 로 변함 확인

- [ ] **Step 5: Commit**

```bash
git add tests/api/icons.test.ts
git commit -m "test: add FTS search and pagination integration tests"
```

---

## 비스코프 (이 plan에서 만들지 않음)

스펙 §12 와 동일.

- 인증·권한·creator 추적
- 검수 / 승인 워크플로우
- ZIP 묶음 다운로드
- 즐겨찾기·컬렉션
- AI 자동 생성 (서버 LLM 호출)
- BYOK / Provider 어댑터
- 동일 SVG 중복 차단(hash)
- 별도 tags 정규화 테이블
- 시맨틱(벡터) 검색
- i18n
- soft-delete / audit log
- Rate limiting / 모니터링
