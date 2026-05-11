# 다중 결과 아이콘 생성 — 설계

- 작성일: 2026-05-07
- 상태: Draft (사용자 리뷰 대기)
- 작성: 브레인스토밍 합의 결과
- 대상 디렉토리: `/Users/jmchoi/Desktop/incoassets`
- 관련 문서: [`2026-05-06-incoassets-design.md`](./2026-05-06-incoassets-design.md)

---

## 1. 변경의 동기 / 한 줄 정의

업로드 모달에서 외부 LLM이 *단일 SVG*만 출력하도록 안내하던 흐름을, **N개(default 4, 범위 4~8) 변형을 한 번에 출력 → 카드 그리드로 표시 → 카드별 저장/복사** 흐름으로 바꾼다. 같은 KEYWORD에 대한 *서로 다른 창의적 해석*을 한 번에 비교하고 마음에 드는 것만 골라 라이브러리에 추가할 수 있게 한다.

## 2. Before / After

### Before (현재)

```
[키워드/설명 입력]
  → [PromptGuidePanel] (단일 객체 출력 프롬프트)
  → 사용자가 외부 LLM에서 받은 결과를 [Paste/File 탭]에 입력
  → 단일 미리보기 1개 + 메타 입력 폼
  → [저장] → POST /api/icons → 모달 닫힘
```

### After

```
[키워드/설명 입력] + [결과 개수: 4 ▾ (4~8)]
  → [PromptGuidePanel] (N개 array 출력 프롬프트, COUNT 반영)
  → 사용자가 외부 LLM에서 받은 결과(array JSON)를 [Paste/File 탭]에 입력
  → [카드 그리드] (N개, grid paper 배경, Customize 실시간 적용)
       각 카드: SVG 미리보기 + [저장] [복사]
  → 카드별로 [저장] 클릭 → POST /api/icons (각 1회)
       클릭 후: 버튼 "저장 → 저장됨" (비활성)
  → 닫기는 Dialog 기본 X / ESC / backdrop
```

핵심 변화:
- 다중 *선택 + 일괄 저장* 이 아니라 **카드별 단독 저장** 모델 (선택 상태 없음)
- LLM 출력 스키마: 단일 `{name,tags,category,svg}` → wrapper `{ items: [...] }`
- 카드 메타 편집 UI 없음 — LLM 응답 메타를 *그대로* 저장 (D2)
- variant/angle 라벨은 *프롬프트 enum 강제용*이고 UI 비노출 / DB 미저장 (E1)
- 백엔드 `POST /api/icons` *무수정*

---

## 3. 프롬프트 변경 — `composables/promptGuide.ts`

### 3.1 시그니처

```ts
export function buildPrompt(
  keyword: string,
  description?: string,
  count: number = 4
): string;
```

- `count`는 4~8로 클램프. 4 미만은 4로, 8 초과는 8로.
- 새 placeholder `<COUNT>` 가 템플릿에 추가됨. Variation Mandate / Output Rules 두 곳에서 참조되므로 `replaceAll` (또는 정규식 `/g`)로 치환.

### 3.2 프롬프트 본문 추가/변경

기존 프롬프트의 다음 섹션을 *교체/보강*:

**(a) Schema 섹션** — 단일 객체에서 wrapper 객체로:

```jsonc
{
  "items": [
    {
      "name": string,        // KEYWORD 영문 Title Case 직역, 추가 단어 금지 (예: "결제" → "Payment")
      "tags": string[],      // 3~6개 영문 소문자 단일 단어
      "category": string,    // 영문 소문자 1단어 (device, finance, system, iot, ui ...)
      "angle": string,       // ↓ 다음 enum에서 정확히 1개. items 사이에서 중복 금지
      "svg": string          // SVG Output Rules 정확히 준수
    }
    // ... <COUNT>개 ...
  ]
}
```

**(b) `## Variation Mandate` (신설 섹션)** — Schema 위에 배치:

> ## Variation Mandate (필수)
> - 정확히 `<COUNT>`개의 item을 출력. *부족하거나 초과 금지*.
> - 각 item은 다른 `angle` enum 값을 가져야 한다 (중복 절대 금지). 가용 enum:
>   `["standard", "with-action", "minimal", "composed", "in-context", "with-detail", "abstract", "scene"]`
> - 각 item은 *다른 composition pattern* (Single Center / Stack / Scene-Tree)을 골고루 사용하라.
> - 각 item은 *다른 객체 조합 / 다른 anatomy 초점*을 가져야 한다. 같은 구도에서 minor variation만 두는 것은 거절.
> - Self-Check에 추가: items[i].svg와 items[j].svg가 silhouette 단계에서 분명히 구분되는가?

**(c) `## Output Rules`** — 다음 항목 추가:

- "최상위는 `{ "items": [...] }` 객체. 최상위에 raw array만 두는 것 금지, 코드펜스(\`\`\`json … \`\`\`) 금지, 어떠한 prose도 금지."
- "items.length === `<COUNT>`."

**(d) Example 섹션** — 단일 객체 예시 → 2-item array 예시로 교체:

```json
{
  "items": [
    { "name": "Smart Home Security", "tags": [...], "category": "iot", "angle": "scene", "svg": "<svg ...>...</svg>" },
    { "name": "Smart Home Security", "tags": [...], "category": "iot", "angle": "minimal", "svg": "<svg ...>...</svg>" }
  ]
}
```
(2개만 보여주는 이유: 토큰 절약 + LLM이 *예시 길이를 답안 길이로 모방하는* 경향 회피)

### 3.3 호환성

기존 `buildPrompt(keyword, description?)` 콜사이트는 `count` 누락 시 4로 폴백되므로 깨지지 않음. 다만 콜러(`PromptGuidePanel`)에서 `count` 를 명시적으로 전달하도록 시그니처 갱신.

---

## 4. 입력 파싱 변경 — `utils/svg/validate.ts`

### 4.1 신규 함수

```ts
export type ParsedItem = {
  svg: string;                       // 원시 SVG 문자열
  meta: Partial<IconMeta> | null;    // LLM이 제공한 메타 (없으면 null)
};

export function parseUploadList(raw: string): ParsedItem[];
```

### 4.2 판정 순서 (위에서부터 매치)

1. 코드펜스 strip (\`\`\`json ... \`\`\`).
2. JSON.parse 시도:
   - `{ items: [...] }` 형태 → 각 item을 `{ svg, meta }` 로 매핑.
   - 최상위 raw array `[...]` → 각 element를 동일하게 매핑.
   - 단일 객체 `{ name, svg, ... }` (legacy) → `[parsed]` 1개로 래핑.
3. JSON 파싱 실패 → 입력 전체에서 *모든* `<svg>...</svg>` 매치 (`/<svg[\s\S]*?<\/svg>/gi`)를 추출. 각 매치를 `{ svg, meta: null }` 로. (구버전 호환 + 사용자가 raw SVG 여러 개 paste한 경우)
4. 매치 0개면 `[]` 반환.

### 4.3 검증

- 호출 측에서 각 item의 `svg`에 대해 `validateAndNormalizeSvg`를 *독립적으로* 실행. 일부 invalid 여도 valid한 것은 그대로 카드로 노출.
- 기존 `parseUploadInput` (단일 입력) 시그니처는 *유지*. 내부적으로 `parseUploadList` 의 첫 element를 반환하는 thin wrapper로 두거나, 호출 사이트(`server/api/icons/index.post.ts`)는 그대로 두고 `parseUploadList`만 신규 노출. **권장: 둘 다 유지.** 서버 POST는 단일 svg 본문을 받으므로 `parseUploadInput` 그대로, 클라이언트만 `parseUploadList` 사용.

### 4.4 메타 추출

각 item에서 `name / tags / category / description` 만 추출. `angle` 필드는 *읽지 않음* (UI 비노출 / DB 미저장 결정).

---

## 5. 모달 UI 변경 — `components/UploadModal.vue` + 신규 `IconResultCard.vue`

### 5.1 레이아웃

```
┌─ Dialog (size=xl) ────────────────────────────────────────────┐
│ Header: SVG 업로드 / 설명                                     │
│                                                                │
│ [키워드 *] [____________]                                     │
│ [설명]     [____________]                                     │
│                                                                │
│ ┌─ 좌: PromptGuidePanel ──────────┐ ┌─ 우: Paste/File 입력 ─┐ │
│ │ Header: Prompt   [결과개수 4 ▾] │ │ [Paste|File]          │ │
│ │  + [📋 프롬프트 복사]            │ │ [textarea / dropzone] │ │
│ │ <pre> 프롬프트 본문 </pre>      │ │                       │ │
│ └─────────────────────────────────┘ └───────────────────────┘ │
│                                                                │
│ ── 결과 그리드 (items 0개면 비표시) ────────────────────────  │
│  헤더: "결과 · {keyword} · {N}개" (좌)                        │
│        — 우측 보조 버튼 없음                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                │
│  │ [grid bg]│ [grid bg]│ [grid bg]│ [grid bg]│                │
│  │ <preview>│ <preview>│ <preview>│ <preview>│                │
│  │          │          │          │          │                │
│  │  [저장]  │  [저장]  │  [저장]  │  [저장]  │                │
│  │  [복사]  │  [복사]  │  [복사]  │  [복사]  │                │
│  └──────────┴──────────┴──────────┴──────────┘                │
│                                                                │
│ ── footer 없음 (Dialog 기본 X로 닫음) ─────────────────────── │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 결과 개수 selector

위치: `PromptGuidePanel`의 헤더 우측 (기존 [📋 복사] 버튼과 같은 줄, 그 좌측).

- UI: shadcn Select 또는 native `<select>` 또는 stepper. 4~8 정수.
- 변경 시:
  - 프롬프트 본문이 즉시 갱신 (`buildPrompt(keyword, description, count)` reactive computed).
  - 이미 paste된 결과 그리드는 *보존*. (사용자가 다시 LLM 호출/paste해야 새 카운트가 반영됨)

### 5.3 결과 그리드

- **컬럼**: `grid-cols-4` 고정 (4개일 땐 1줄, 8개일 땐 2줄). md 이하 좁은 화면에선 `md:grid-cols-3 sm:grid-cols-2`.
- **카드 배경**: 옅은 grid paper (CSS `background-image: linear-gradient(...)` 12px 간격 정도. 인스피레이션 톤). 미리보기 svg와 시각적 충돌하지 않도록 stroke ≤ 1px의 ultra-light gray.
- **미리보기**: `applyCustomize(item.svg, customizeState)` 결과를 `v-html`. Customize 패널 변경 시 모든 카드 동시 반영.
- **카드 액션 영역 (우측 하단)**: `[저장] [복사]` 버튼 2개.
- **invalid 카드 처리**:
  - 미리보기 영역에 회색 placeholder + 아래 작은 빨간 메시지 (e.g., "viewBox 불일치").
  - [저장] 버튼 비활성 (disabled).
  - [복사] 버튼은 *원본 SVG 문자열* 복사 가능하게 활성 유지 (사용자가 외부에서 수정해서 다시 paste할 수 있도록).

### 5.4 카드별 액션 동작

저장/복사 핸들러는 **카드 컴포넌트 내부 (`IconResultCard.vue`)** 에 둔다 — 카드가 자기 상태(savedState, copyFlash, errorMessage)를 소유하므로 부모는 `results` 배열만 관리. 카드는 `useSearch()`를 직접 호출해 저장 후 라이브러리 갱신.

#### 저장

- 동작: `POST /api/icons` 1회 호출. body는 LLM이 제공한 `{ name, tags, category, description }` + 정규화된 `svg`. `validateMeta`가 통과한 결과만 저장 가능.
- 메타 폴백: LLM이 `name`을 제공하지 않거나 `validateMeta`에서 거절되면 → keyword (모달 props.keyword)를 `name`으로 사용. 그 외 필드(tags, category)는 빈 값으로 저장 (서버가 기본값 처리).
- 상태 머신 `savedState`: `'idle' | 'saving' | 'saved' | 'error'`.
- 버튼 라벨/상태 매핑:
  - `idle` → "저장" (활성)
  - `saving` → "저장 중…" (비활성)
  - `saved` → "저장됨" (비활성)
  - `error` → "재시도" (활성, 클릭 시 다시 호출)
- 성공 시: `useSearch().add(saved)` 호출 → 라이브러리 그리드에 즉시 노출. 카드는 `saved` 상태로 잠김 (다시 누르면 무동작).
- 실패 시: 카드 안 작은 빨간 텍스트로 에러 메시지. 사용자 [재시도] 가능.

#### 복사

- 동작: `navigator.clipboard.writeText(item.svg)`. SVG 문자열은 *정규화된* `svg` (Customize 미적용 형태). 외부 도구에 붙여넣고 다시 paste해도 표준 포맷 유지.
- 상태 `copyFlash`: true → 버튼 라벨 "복사됨"으로 1.5초 표시 후 원래대로. 기존 `PromptGuidePanel.copy()` 패턴 동일.

### 5.5 Paste/File 탭과 그리드의 결합

- 기존 `validated` / `previewSvg` / `canSave` computed (단일 입력 가정) **제거**.
- 신규 `results` reactive 배열 (computed가 아닌 ref — 카드 내부 상태 변이가 필요하므로):

```ts
type ResultItem = {
  id: string;                            // 로컬 안정 키 (예: `r-${index}`)
  svg: string;                           // 정규화된 SVG (실패 시 원본 유지)
  validation: ValidationResult;          // ok | errors
  rawMeta: Partial<IconMeta> | null;     // LLM이 제공한 메타 (없으면 null)
  // 이하 카드 내부에서 변이:
  savedState: 'idle' | 'saving' | 'saved' | 'error';
  copyFlash: boolean;
  errorMessage: string;
};

watch(rawInput, (val) => {
  if (!val.trim()) {
    results.value = [];
    return;
  }
  results.value = parseUploadList(val).map((p, i) => {
    const v = validateAndNormalizeSvg(p.svg);
    return {
      id: `r-${i}`,
      svg: v.ok ? v.svg : p.svg,
      validation: v,
      rawMeta: p.meta,
      savedState: 'idle',
      copyFlash: false,
      errorMessage: '',
    };
  });
});
```

- `rawInput`이 바뀌면 `results`가 *완전히 재생성* (이전 카드의 saved 상태도 리셋). 사용자가 새 paste를 하면 새 batch.
- File 탭에서 단일 .svg 파일 업로드는 `parseUploadList`가 `[{ svg, meta: null }]` 1개로 래핑하므로 *동일 코드 경로*로 1-card 그리드로 표시됨.
- 카드 내부에서 `savedState` 등 변이는 `result.value[i].savedState = 'saved'` 식 직접 변이 또는 props.modelValue 패턴 중 implementation plan에서 결정.

### 5.6 Footer / 닫기

- `<DialogFooter>` 슬롯 *제거*.
- Dialog 컴포넌트가 우상단에 기본 X 버튼을 노출 (기존 shadcn-vue Dialog 동작). 추가로 ESC / backdrop click도 동작.
- `props.open`이 false로 바뀌면 모달 reset 로직(rawInput, count default 4)도 그대로 유지.

### 5.7 신규 컴포넌트 분리 — `components/IconResultCard.vue`

`UploadModal.vue` 가 너무 커지지 않도록 카드 한 장을 별도 컴포넌트로 분리:

- Props: `{ item: ResultItem, fallbackName: string }` (`fallbackName`은 모달의 `localKeyword` — 메타 폴백용)
- Emits: 없음 (자기 fetch + `useSearch()` 직접 호출)
- 내부:
  - SVG 미리보기 (`applyCustomize(item.svg, customize)` v-html). `useCustomize()` store 직접 구독.
  - [저장] / [복사] 버튼.
  - 에러 메시지 영역.
  - savedState / copyFlash / errorMessage는 *카드 컴포넌트의 로컬 ref* (props.item에 직접 변이하지 않음 → 부모-자식 데이터 흐름 단방향 유지).
- 부모(`UploadModal`)는 `results` 배열만 보유. `rawInput` 변경 시 results 재생성하는데, 카드 컴포넌트는 `id` props 변경 시 reset되므로(또는 `:key="item.id"` 사용) 새 batch가 들어오면 자연스럽게 idle 상태로 시작.

---

## 6. Customize 패널 — 무변경

기존 `CustomizePanel.vue` / `stores/customize.ts` 그대로. 모든 카드의 미리보기가 같은 store를 구독 → 색/사이즈/스트로크 변경 시 N개 카드가 동시에 반응.

저장 시점에는 `applyCustomize` *적용 전* 정규화 SVG (`v.svg`)를 POST. 즉 저장된 데이터는 그대로 `currentColor` sentinel 형태로 보존, 라이브러리 그리드에서 다시 Customize 적용. (기존 동작과 동일.)

---

## 7. 백엔드 — 무변경

`POST /api/icons` (단일 1건 INSERT) 그대로. 카드 개수 N만큼 *병렬* 호출.

- 슬러그 충돌은 기존 `insertIcon`이 자동으로 `-2`, `-3`, ..., 그래도 안 되면 `-{nano6}` 처리.
- `name` 중복은 DB 레벨에서 허용 (스키마에 unique 없음).
- 동시 INSERT 경합은 `better-sqlite3`가 자동 직렬화 → 별도 처리 불필요.

배치 엔드포인트 `/api/icons/batch`는 *도입하지 않음*. 4~8 병렬 SQLite write는 부하 걱정 없음.

---

## 8. 변경 파일 목록

### 8.1 수정

```
composables/promptGuide.ts        # buildPrompt 시그니처 + 프롬프트 본문 (Schema, Variation Mandate, Output Rules, Example)
utils/svg/validate.ts             # parseUploadList 추가. parseUploadInput는 보존
components/PromptGuidePanel.vue   # count selector 추가, props에 count 받음
components/UploadModal.vue        # results computed, 카드 그리드, footer 제거, paste/file 탭 단일미리보기/메타폼 제거
```

### 8.2 신규

```
components/IconResultCard.vue     # 카드 1장 + [저장] [복사] 액션
```

### 8.3 삭제 (UploadModal에서 빠지는 것)

- 단일 미리보기 영역 (모달 내 "미리보기 (Customize 패널 적용)" 섹션)
- 메타데이터 폼 (name / category / tags 입력 inputs)
- footer의 [취소] / [저장] 버튼
- 단일 입력 기준 `validated`, `previewSvg`, `canSave` computed
- `save()` 단일 함수 (대신 카드별 saveCard로 분산)

---

## 9. 사용자 흐름 / 엣지 케이스

| 상황 | 처리 |
|---|---|
| paste 비어있음 | 결과 그리드 비표시. 안내 메시지 (기존 PromptGuidePanel 하단 안내 유지) |
| LLM이 단일 객체로 출력 | `parseUploadList`가 1개짜리 array로 래핑 → 1-card 그리드 |
| LLM이 raw array로 출력 | `parseUploadList`가 array 그대로 매핑 |
| LLM이 8개 요청했는데 5개만 출력 | 5-card 그리드. 부족하다는 경고 노출 안 함 (사용자 재량) |
| items 중 일부만 invalid | invalid 카드만 회색 + 비활성 [저장]. 나머지는 정상 |
| 같은 카드 [저장] 연타 | savedState로 디바운스 (saving 중엔 다시 호출 안 함) |
| 저장 실패 (네트워크/서버) | 카드 상태 'error' + 에러 메시지. 사용자가 [재시도] 클릭 가능 |
| paste 내용 변경 | results 완전 재생성. 이전 saved/copied 상태 리셋 |
| count selector 변경 | 프롬프트만 재생성. paste된 결과 그리드는 유지 |
| File 탭 단일 .svg | 1-card 그리드로 흐름 통일 (legacy 흐름 그대로 동작) |

---

## 10. 비스코프 (이번에 안 함)

- "↓ 전체 저장" / "지우기" 같은 헤더 일괄 액션
- 저장 후 카드 좌상단 ✓ 배지 (버튼 라벨 변화로 충분)
- 카드 hover 시 추가 액션 (regenerate, view code 등)
- 카드별 메타 편집 popover/accordion (LLM 메타 그대로 사용)
- "최근 생성" 히스토리 스트립 (별도 영속화 필요, 후속 작업)
- variant/angle DB 저장 또는 검색 노출
- 카드별 독립 Customize (현재는 전역 Customize 1세트만)
- 배치 API 엔드포인트 `/api/icons/batch`
- 단일 SVG 다중 paste 안내 (기능은 동작하되 명시적 UI 가이드 없음)

---

## 11. 테스트 전략

테스트 파일 위치는 프로젝트 컨벤션(`vitest.config.ts: include: ['tests/**/*.test.ts']`)을 따름.

### P0 (반드시)

- `tests/unit/promptGuide.test.ts` (신규)
  - `buildPrompt(k)` count 디폴트 4 — 프롬프트에 "정확히 4개" 류 표현 포함
  - `buildPrompt(k, d, 6)` `<COUNT>` 슬롯이 6으로 치환
  - `buildPrompt(k, d, 99)` 8로 클램프, `buildPrompt(k, d, 1)` 4로 클램프
- `tests/unit/svg.validate.test.ts` (기존 파일에 케이스 추가)
  - `parseUploadList`: `{items:[...]}` / raw array `[...]` / 단일 객체 `{name,svg,...}` (legacy) / raw `<svg>...</svg>` 단일 / 코드펜스 strip / 여러 `<svg>` raw 매치 / 빈 입력
  - 각 케이스에서 메타 prefill 정확성 (있으면 채워짐, 없으면 null)
- `tests/api/icons.test.ts` (확장 불필요 — 백엔드 무수정)

### P1

- `tests/components/IconResultCard.test.ts` (신규)
  - 정상 카드 렌더 + 저장 클릭 → fetch 호출 + savedState 변화 (idle → saving → saved)
  - 저장 실패 → error 상태 + 재시도 시 다시 saving → saved
  - 복사 클릭 → clipboard 호출 + flash "복사됨" 표시 후 1.5초 후 원래대로
  - invalid 카드 → 저장 비활성, 복사는 활성, 에러 메시지 표시
  - 메타 폴백 — rawMeta가 null일 때 fallbackName으로 저장
- `tests/components/UploadModal.test.ts` (신규)
  - paste 입력 → results 그리드 N개 렌더
  - paste 변경 → results 재생성, 이전 카드 saved 상태 리셋
  - count selector 변경 → 프롬프트 텍스트 갱신, paste 보존

### P2 (후속)

- E2E: 키워드 입력 → 프롬프트 복사 → (수동 LLM) → paste → 카드 4개 → 2개 저장 → 라이브러리에 2개 추가됨

---

## 12. 마이그레이션 / 롤아웃

- DB 변경 없음. 마이그레이션 불필요.
- 기존 단일 객체 입력은 1-card 그리드로 자동 변환되므로, 외부 LLM 프롬프트 가이드를 갱신해서 제공하기 전까지 *기존 사용자 흐름이 깨지지 않음*.
- 롤아웃 후 곧바로 새 프롬프트로 4개 출력하도록 안내.

---
