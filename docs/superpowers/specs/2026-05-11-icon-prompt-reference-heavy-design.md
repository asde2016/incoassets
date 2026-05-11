# 외부 LLM 프롬프트 빌더 재설계 — Reference-Heavy v2

- 작성일: 2026-05-11
- 상태: Draft (사용자 리뷰 대기)
- 작성: 브레인스토밍 합의 결과
- 대상 디렉토리: `/Users/jmchoi/Desktop/incoassets`
- 관련 문서: [`2026-05-07-multi-result-icon-generation-design.md`](./2026-05-07-multi-result-icon-generation-design.md)

---

## 1. 변경의 동기 / 한 줄 정의

`build-prompt → 외부 LLM(Claude/GPT/Gemini)에 복붙 → 결과 import` 흐름에서, **외부 LLM이 만들어내는 SVG가 `reference/` 폴더 스타일과 동떨어진 빈약한 결과**(미니멀 도형, 캔버스 30% 사용, 듀오톤 fill 부재)로 나오는 문제를 해결한다. `server/utils/iconPromptBuilder.ts` 의 `renderPrompt()` / `getConceptTokens()` / `collectReferences()` 3 함수를 보강하고, 부수적으로 결과 검증을 강화한다.

기존 워크플로(UploadModal · build-prompt.post.ts · iconPromptBuilder.ts · UploadModal 결과 영역)는 **모두 유지**. 손대는 곳은 한정적이다.

## 2. 기존 워크플로 (정정)

```
UploadModal
   ├ 키워드 + 설명 + count(1/2/3/4/6/8)
   └ "프롬프트 생성"
        ↓ POST /api/icons/build-prompt
[iconPromptBuilder.buildPrompt()]
   ├ ① getConceptTokens(): ollama qwen3.5:9b → 영문 토큰 4~6개
   ├ ② collectReferences(tokens, 5): tabler/hugeicons/lucide round-robin → ref 5개
   └ ③ renderPrompt(): 외부 LLM용 완성 프롬프트 빌드
        ↓ { prompt, tokens, references }
[UploadModal] prompt textarea + 복사 버튼
        ↓ 사용자가 GPT/Claude/Gemini 웹에 복붙
[외부 LLM] → JSON { items: [{name,tags,category,angle,svg}] }
        ↓ 사용자가 "결과 붙여넣기" textarea에 복붙
[Frontend: parseUploadList + validateAndNormalizeSvg + IconResultCard]
        ↓ 카드별 저장
[POST /api/icons → repo/icons.ts → sqlite icons.db]
```

이 흐름의 **③번 출력 품질**이 본 변경의 유일한 목표다.

## 3. 진단 — 기존 `renderPrompt()` 의 6개 약점

(`server/utils/iconPromptBuilder.ts:155-231` 분석 결과)

| # | 약점 | 결과물에 미치는 영향 |
|---|---|---|
| W1 | iconify 후보가 outline-only line-art. 프롬프트는 "inspiration only — don't copy verbatim"이라고만 함. | LLM이 reference 스타일을 따라 outline만 그림 → 듀오톤 fill 거의 없음 |
| W2 | reference의 viewBox 0~24와 출력 viewBox 0~512 간 스케일 변환 미명시. | LLM이 0~24 좌표계 감각으로 작게 그림 → 캔버스 30%만 사용 |
| W3 | "fill the canvas" CRITICAL 룰이 프롬프트 중간(L177~187)에 위치. | LLM의 recency bias로 출력 직전엔 잊힘 |
| W4 | A/B/C 분류에 페르소나(인물) 카테고리 없음. "연구원/scientist/engineer"가 atomic/scene/paired 어디에도 안 맞음. | "사람 머리 + 어깨 + 작은 도구" 어정쩡한 절충안 (사용자 스크린샷의 모습) |
| W5 | 듀오톤 fill 위치 가이드가 너무 일반적("interior content panels, screens, badges, markers"). | LLM이 fill 적용 위치 모호 → 안전하게 생략 |
| W6 | `getConceptTokens()` 가 페르소나 키워드 특별 처리 안 함. | reference에 사람 아이콘 부족 → 사람 빈약 |

## 4. 변경 디자인

### 4.1 `renderPrompt()` 6개 개선 (W1~W5 대응)

**(I1) Reference 스케일 명시**

`renderReferenceBlock()` 의 헤더 라인 변경:

```
# Library reference vocabulary (LINE ANATOMY only — viewBox 0..24)
These references show the structural anatomy of related concepts.
You MUST reproduce the STRUCTURE but at 512 scale (×21.3) and WITH duotone fills added.
Stroke-width=6 at 512 reads as a bold ~16px stroke — match that visual weight.
Reference 본문이 outline-only라고 해서 당신의 출력도 outline-only여서는 안 됩니다.
```

각 후보 헤더는 그대로:
```
[REF_1] tabler:flask (viewBox 0 0 24 24)
<path .../><path .../>...
```

**(I2) Outline → Duotone 변환 룰 (W1, W5 대응)**

reference block 직후에 다음 단락 추가:

```
# Duotone fill mandate
Every reference shown above is outline-only (no fills). Your output MUST add
fill="currentColor" to the following surface categories whenever they appear:

  Screens / panels   : laptop·monitor screens, phone displays, dashboard inner panels
  Containers         : speech-bubble interiors, card bodies, badge backgrounds, signs
  Solid markers      : chart bars, status dots, progress fills, buttons, traffic-light dots
  Body / clothing    : lab-coat torsos, shirt fronts, helmet caps, vehicle bodies (large)
  Hair / cap         : hair masses, beanie/hat surfaces

Leave OUTLINE-only (no fill):
  Outer device chassis (phone body, laptop hinge, monitor frame outer rect)
  Container frames (window outer rect, briefcase outer)
  Decorative trim, antenna/cable lines, connectors

Each item.svg must contain ≥ 3 fill="currentColor" shapes. Pure outline items are INVALID.
```

**(I3) 페르소나(D) 카테고리 추가 (W4 대응)**

기존 A/B/C 분류 (L189~209) 뒤에 D 추가:

```
D) Persona / role concept — examples: scientist, researcher, doctor, engineer,
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
   → angle enum for persona variants:
       "standard"      — front-facing person + 1 tool, balanced left/right
       "with-tool"     — emphasis on tool (tool larger, person slightly offset)
       "with-detail"   — same composition, more internal anatomy (badge, ID card, equipment dial)
       "minimal"       — STILL full 8-part person + tool, just lighter accent detail
       "in-context"    — person inside a scene (lab bench, monitor, desk)
       "abstract"      — symbolic representation (person silhouette + tool, no facial features)
   → IMPORTANT: when KEYWORD classifies as D, use ONLY the persona angle enum above.
     Do not mix in atomic/scene angles like "with-action", "composed", "scene".
```

분류 안내문도 갱신:
```
For the KEYWORD "<KEYWORD>", first decide A / B / C / D, then generate the <COUNT> variants accordingly.
The item.angle enum depends on the category:
  A (atomic)  → "standard", "with-detail", "composed"
  B (scene)   → "window-scene", "device-stack", "network", "container-inside"
  C (paired)  → "device-stack", "network", "container-inside"
  D (persona) → "standard", "with-tool", "with-detail", "minimal", "in-context", "abstract"
Each item.angle must be unique within the response.
```

**(I4) "Fill the canvas" 룰을 출력 JSON 스펙 직전에 재배치 (W3 대응)**

기존 L177~187 의 safe-area 조건은 유지. 추가로 출력 스펙(L215) 직전에 다음을 prepend:

```
# LAST REMINDER before output
For EACH item:
- bbox must span ≥ 400 on BOTH axes (min ≤ 56, max ≥ 456 on x AND y).
- ≥ 3 shapes use fill="currentColor".
- 14~24 primitive shapes total.
- For persona keyword: head circle exists at y ≤ 180 AND body shape ≥ 240 wide.

If any of these fails, REDRAW before emitting. A miniature in the center is rejected.
```

**(I5) Self-check loop을 출력 스펙 안에 명시**

기존 출력 스펙(L227~231)의 Constraints 직전에 추가:

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

**(I6) 페르소나 예시 1개를 출력 스펙에 추가**

기존 Dashboard 예시(L225) 직전 또는 직후에 페르소나 예시 1개 추가:

```jsonc
{"items":[{"name":"Researcher","tags":["scientist","lab","flask","person"],"category":"persona","angle":"standard","svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"200\" cy=\"128\" r=\"48\"/><path d=\"M160 100 Q160 64 200 64 Q240 64 240 100 Q236 88 224 88 Q200 96 176 88 Q164 90 160 100Z\" fill=\"currentColor\"/><circle cx=\"188\" cy=\"128\" r=\"4\" fill=\"currentColor\"/><circle cx=\"212\" cy=\"128\" r=\"4\" fill=\"currentColor\"/><line x1=\"140\" y1=\"196\" x2=\"260\" y2=\"196\"/><path d=\"M120 420 Q116 280 156 240 L188 232 L188 264 Q200 280 212 264 L212 232 L244 240 Q284 280 280 420 Z\" fill=\"currentColor\"/><path d=\"M188 232 L200 260 L212 232\"/><circle cx=\"200\" cy=\"316\" r=\"5\" fill=\"currentColor\"/><circle cx=\"200\" cy=\"344\" r=\"5\" fill=\"currentColor\"/><rect x=\"232\" y=\"272\" width=\"32\" height=\"24\" rx=\"4\"/><line x1=\"260\" y1=\"260\" x2=\"260\" y2=\"412\"/><rect x=\"340\" y=\"240\" width=\"60\" height=\"24\" rx=\"4\"/><path d=\"M348 264 L344 320 Q320 360 332 408 Q360 432 408 408 Q420 360 396 320 L392 264\" fill=\"currentColor\"/><line x1=\"332\" y1=\"360\" x2=\"408\" y2=\"360\"/><line x1=\"354\" y1=\"284\" x2=\"386\" y2=\"284\"/></svg>"}]}
```

(이 SVG는 8요소 페르소나 + flask 6요소 = 16 shapes, bbox x=120..408 y=64..432 — 가이드 충족)

### 4.2 `getConceptTokens()` 페르소나 사전 (W6 대응)

```ts
const PERSONA_HINTS: Record<string, string[]> = {
  // 한국어 키워드 → 강제 prepend 토큰
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
  // 영문도 매칭 (대소문자 무시)
  scientist:  ['person', 'scientist', 'lab', 'flask'],
  researcher: ['person', 'researcher', 'lab', 'microscope'],
  developer:  ['person', 'developer', 'laptop', 'code'],
  engineer:   ['person', 'engineer', 'gear'],
  doctor:     ['person', 'doctor', 'stethoscope'],
  teacher:    ['person', 'teacher', 'book'],
  designer:   ['person', 'designer', 'palette'],
};

export async function getConceptTokens(keyword, description) {
  const norm = keyword.toLowerCase().trim();
  const hint = PERSONA_HINTS[norm] ?? PERSONA_HINTS[keyword.trim()];
  // 페르소나 키워드는 ollama LLM 호출을 건너뛰고 사전 매칭 결과만 사용
  // (의도: ollama가 도구 토큰을 더 많이 뱉어내 사람 후보가 밀리는 현상 차단)
  if (hint) return hint;

  // 기존 로직 그대로 (ollama 호출 후 fallback 포함)
  // ...
}
```

- 페르소나 사전 매칭 시 ollama 호출 자체를 건너뛰어 응답 시간 단축 + 일관성 보장.
- 사전에 없는 페르소나는 기존 로직대로 ollama가 처리.

### 4.3 `collectReferences()` 페르소나 시 maxTotal 확장

```ts
// 기존:
const references = collectReferences(tokens, 5);

// 변경:
const isPersona = tokens[0] === 'person';
const references = collectReferences(tokens, isPersona ? 6 : 5);
```

- 페르소나일 때 `person` 토큰이 첫 슬롯에 잡혀있으니 round-robin 첫 회전에서 사람 아이콘 1개 확보.
- maxTotal 6은 person 1 + tool 5의 여유.

### 4.4 `utils/svg/validate.ts` 검증 강화

기존 `validateAndNormalizeSvg()` 의 검증 결과에 **차단(block) 이 아닌 경고(warning) 레벨**로 다음 4개 추가:

```ts
type SvgValidation = {
  ok: boolean;
  svg: string;
  errors: string[];      // 차단 — 기존 그대로
  warnings: string[];    // 경고 — 신규
};

// 신규 체크 (모두 warning):
//  W-BBOX-X:  bbox x span < 400  → "Canvas under-used on x axis (span={x})"
//  W-BBOX-Y:  bbox y span < 400  → "Canvas under-used on y axis (span={y})"
//  W-SHAPES:  shape count ∉ [14, 24] → "Shape count {n} outside [14,24] target"
//  W-FILLS:   fill='currentColor' 개수 < 3 → "Only {n} filled regions — duotone may look flat"
```

`IconResultCard.vue` 에서 warnings 가 있으면 카드 우상단에 노란 ⚠ 뱃지 + tooltip 으로 표시. 저장은 그대로 가능.

**구현 메모**:
- bbox 계산: SVG 파싱해서 모든 `rect/circle/ellipse/line/polyline/polygon/path` 의 좌표 추출 → min/max.
- `path` 의 bbox는 d 속성에서 M/L/Q/C/A 의 absolute 좌표만 단순 추출 (relative 좌표는 보수적으로 skip). 정확도가 100% 필요 없음 — warning 용도이므로 false negative 무방.
- 라이브러리 없이 정규식 + 단순 파서로 구현 (의존성 추가 없음).

## 5. 변경 파일 / 영향 범위

| 파일 | 변경 내용 | 라인 추정 |
|---|---|---|
| `server/utils/iconPromptBuilder.ts` | `renderPrompt()` 본문 6개 수정, `getConceptTokens()` 사전 추가, `collectReferences()` 호출부 maxTotal 분기 | +120 / -30 |
| `utils/svg/validate.ts` | `SvgValidation` 타입에 `warnings` 추가, bbox/shape/fill 카운트 검사 함수 추가 | +80 |
| `components/IconResultCard.vue` | warnings 표시 UI (⚠ 뱃지 + tooltip) | +20 |
| `components/UploadModal.vue` | 변경 없음 (기존 흐름 그대로) | 0 |
| `server/api/icons/build-prompt.post.ts` | 변경 없음 | 0 |
| `server/utils/iconCompose.ts` | **본 변경의 대상 아님** (별개의 generate API 경로). 추후 정리 가능하나 본 스펙 범위 외. | 0 |

## 6. 비기능 / 호환성

- **응답 시간**: 페르소나 사전 히트 시 ollama 호출 1회 절약 → 0.5~3초 단축. 비페르소나는 영향 없음.
- **외부 LLM 토큰 비용**: 프롬프트가 약 120줄 길어짐 (대략 +1.5k 토큰). Claude/GPT/Gemini 모두 무료 한도 내. 사용자 부담 없음.
- **기존 결과 데이터 호환**: icons.db 스키마 변경 없음, validate.ts 의 warnings 는 ResultItem 에만 추가되고 저장은 변함 없음.
- **롤백**: `iconPromptBuilder.ts` 하나만 되돌리면 즉시 원복.

## 7. 검증 방법

스펙 자체를 검증할 수 있는 항목:

1. **페르소나 키워드 4종**으로 build-prompt 호출:
   - `연구원`, `개발자`, `의사`, `엔지니어`
   - 응답의 `tokens[0]` 이 `"person"` 인지 확인
   - 응답의 `references` 에 user/person 계열 아이콘이 ≥ 1개 포함되는지
2. **비페르소나 키워드 3종**으로 build-prompt 호출:
   - `데이터베이스`, `클라우드 동기화`, `결제`
   - 기존과 동일하게 ollama 호출이 발생하는지 (응답 시간/로그)
3. **외부 LLM 출력 품질 확인** (수동):
   - 위 6개 키워드를 Claude / GPT / Gemini 3종에 각각 복붙
   - 결과 SVG 의 bbox/shape/fill 카운트가 가이드 충족하는지 IconResultCard 의 warnings 로 즉시 확인
4. **검증 강화 동작**: 의도적으로 빈약한 SVG 를 결과 영역에 붙여넣어 ⚠ 뱃지가 표시되는지

자동 테스트는 본 스펙 범위 외 (외부 LLM 출력은 결정론적이지 않으므로 단위 테스트가 무의미). 다만 `validate.ts` 의 bbox/shape/fill 카운트 함수는 단순 정규식 기반이라 vitest 로 작은 fixture 테스트 추가 가능 (선택).

## 8. 비범위 (Out of scope)

- `server/utils/iconCompose.ts` 의 ollama generate API 경로는 손대지 않음. 본 스펙은 외부 LLM 경로(build-prompt)만 다룸. iconCompose 정리는 별도 작업.
- 프롬프트의 비-페르소나 카테고리(A/B/C) 본문 자체는 변경하지 않음. 기존 텍스트 유지.
- iconify 후보를 듀오톤으로 서버에서 사전 변환하는 옵션은 채택하지 않음 (LLM 에게 outline→duotone 변환을 명시적으로 시키는 것이 더 안정적).
- 외부 LLM 별 (Claude vs GPT vs Gemini) 프롬프트 분기는 만들지 않음. 하나의 프롬프트로 3종 모두 통용.

## 9. 후속 작업 (별도 스펙 필요)

- `iconCompose.ts` 의 generate API 경로를 build-prompt 경로로 통합 또는 deprecation
- 프롬프트의 `renderReferenceBlock()` 에 reference 가 0개일 때의 fallback 더 풍부하게 (`(no library references — synthesize from scratch using the style guide alone)` 한 줄로 끝남)
- iconify 후보 SVG 의 토큰 길이가 큰 경우(>500 chars body) 본문 트림 — 본 스펙 범위 외

## 10. 작업 메모 (사용자 합의 사항)

- git 명령은 본 스펙 작업 흐름에 포함하지 않음. 사용자가 직접 처리. (memory: `feedback_no_git_ops`)
- 페르소나 머리/얼굴 묘사는 단순 도형(circle, polygon)으로 처리. Bezier 곡선 사용 최소화. (memory: `feedback_curve_approximation`)