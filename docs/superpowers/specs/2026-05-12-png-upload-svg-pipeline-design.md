# SVG 파이프라인 전면 개편 — PNG 업로드 기반

- 작성일: 2026-05-12
- 상태: Draft (사용자 리뷰 대기)
- 작성: 브레인스토밍 합의 결과
- 대상 디렉토리: `/Users/choejaemin/Desktop/work/incoassets`
- 관련 문서:
  - [`2026-05-12-png-to-svg-poc-design.md`](./2026-05-12-png-to-svg-poc-design.md) (선행 PoC — PNG→SVG 변환 가능성 입증)
  - [`2026-05-11-icon-prompt-reference-heavy-design.md`](./2026-05-11-icon-prompt-reference-heavy-design.md) (제거 대상 — Reference-heavy 프롬프트 빌더)
  - [`2026-05-07-multi-result-icon-generation-design.md`](./2026-05-07-multi-result-icon-generation-design.md) (제거 대상 — 다결과 SVG paste 흐름)

---

## 1. 변경의 동기 / 한 줄 정의

기존 흐름인 **"외부 LLM 의 SVG 텍스트를 사용자가 복붙"** 을 **"외부 LLM 의 duotone PNG 를 사용자가 업로드 → 서버가 SVG 로 변환"** 으로 **전면 교체**한다. SVG 의 텍스트 품질을 LLM 에 의존하던 부분이 사라지고, 시스템이 직접 벡터화하므로 결과의 일관성·예측 가능성이 올라간다.

DB schema(icons 테이블·FTS5), 검색·삭제·복구 API, 라이브러리 그리드 UI 는 그대로 유지한다. 손대는 곳은 **prompt 빌더·UploadModal·SVG 변환·customize transform** 네 곳이다.

## 2. 새 흐름 (UploadModal 1 개 모달 안의 4 step)

```
[A] keyword + base color picker + 설명(선택)
        ↓ "프롬프트 생성"
[B] template 에 {keyword}, {base_hex}, {stroke_hex = base × 0.6},
    {description} 을 치환한 텍스트 출력 + 복사 버튼
        ↓ 사용자가 외부 LLM(Claude/GPT)에 복붙 → duotone PNG 반환
[C] PNG 파일 업로드 (드래그&드롭 또는 file input)
        ↓ POST /api/icons/png-to-svg (multipart)
[D] 변환된 SVG inline 미리보기 + 메타(name/tags/category/description) 입력
        ↓ "등록" 버튼 → POST /api/icons (기존 endpoint) → DB
```

각 step 은 이전 step 의 출력에 의존. step A → D 순차 진행. 모달을 닫지 않고 한 흐름에서 완료.

## 3. 외부 LLM 용 프롬프트 (Step B 출력)

다음 template 의 `{...}` placeholder 만 치환한 결과를 그대로 textarea 에 출력. 외부 의존(Ollama 토큰화·library reference) 없음.

```
Create a flat, minimalist duotone icon of {keyword}.

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

{description}
```

- `{base_hex}`: 사용자가 color picker 로 선택한 6 자리 hex (예: `#256BFA`)
- `{stroke_hex}`: 각 RGB 채널을 0.6 배 후 반올림하여 hex 로 (예: `#152DB6`)
- `{description}`: 비우면 줄 자체를 빈 줄로 출력 (template 형태 보존)

## 4. 변환 파이프라인 (`server/utils/pngToSvg.ts`)

PNG buffer 를 받아 SVG 문자열을 반환하는 단일 모듈. 단계별 함수로 분리.

```
PNG buffer
  │
  ▼ sharp.resize(512, 512, fit: contain, bg: transparent) → raw RGBA
  ▼ alpha + RGB → luminance Y = 0.299R + 0.587G + 0.114B (subject pixels only)
  ▼ Tdark = (Ymin + Ymax) / 2   ← subject 픽셀의 mid luminance
  │
  ├─ darkMask   = subject ∧ (Y <  Tdark)
  │   ├─ Zhang-Suen thinning → 1px skeleton (Uint8Array)
  │   ├─ 8-connected line trace → 정수 좌표 시퀀스 (polyline) 들
  │   └─ Douglas-Peucker simplify (ε ≈ 1.0) → SVG path d-attr (M / L 만)
  │      → P_stroke : path[]
  │
  └─ lightMask  = subject ∧ (Y >= Tdark)
      └─ potrace(turdSize=8, optTolerance=0.4) → closed path[]
         → P_fill : path[]

→ 합본 SVG (저장 형태):
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <g data-layer="fill" fill="{base_hex}">
      <path d="..." /> ...
    </g>
    <g data-layer="stroke"
       fill="none" stroke="{stroke_hex}" stroke-width="24"
       stroke-linecap="round" stroke-linejoin="round">
      <path d="..." /> ...
    </g>
  </svg>
```

저장 형태의 SVG 에는 사용자가 처음 선택한 `base_hex` 와 자동 계산된 `stroke_hex` 가 그대로 박힌다. 다운로드 시 customize 가 두 색을 재계산해 치환한다.

### 4.1 알고리즘 모듈 분리

| 파일 | 책임 |
|---|---|
| `server/utils/imageProcessing/thinning.ts` | Zhang-Suen 이중 패스 thinning. input: `Uint8Array` (binary), output: `Uint8Array` (skeleton) |
| `server/utils/imageProcessing/lineTrace.ts` | 8-connected skeleton → polyline 시퀀스. junction 점에서 분기 |
| `server/utils/imageProcessing/simplify.ts` | Douglas-Peucker. polyline → 단순화된 polyline |
| `server/utils/pngToSvg.ts` | 위 3 개 + sharp + potrace 조합. public: `pngToSvg(buf: Buffer): Promise<string>` |

각 모듈은 의존성이 최소이고, 단위 테스트 가능.

### 4.2 위험 / 대응

| 위험 | 대응 |
|---|---|
| Tdark 가 fixture 와 안 맞아 mask 한쪽이 비어짐 | Otsu threshold 로 교체 (`server/utils/imageProcessing/otsu.ts` 추가). 1차 mid-threshold 가 실패하면 fallback |
| Zhang-Suen 가 작은 노이즈에 가지 생성 | thinning 전에 morphological opening 1 회 (3×3 erode → 3×3 dilate). 또는 line trace 후 길이 < 5 인 branch 제거 |
| line trace 가 너무 많은 짧은 polyline 생성 | DP simplify ε 를 1.0~2.0 사이 튜닝. 또는 path 끼리 endpoint 가까운 것 병합 (post-merge) |
| centerline path 가 광택성 곡선이 아닌 각진 polyline | M/L 만 사용 — PoC 적합. Q/C 곡선화는 다음 iteration |

## 5. 다운로드 customize 재구현 (`utils/svg/transform.ts`)

기존 `applyCustomize` 는 currentColor 치환 + 면적 휴리스틱 기반. 새 SVG 구조에 안 맞으므로 **전체 재작성**.

```typescript
// utils/svg/transform.ts (재작성)

export type CustomizeState = {
  size: number;          // px, root width/height
  strokeWidth: number;   // root <g data-layer="stroke"> 의 stroke-width
  mode: 'duotone' | 'linear';
  color: string;         // hex, base color
};

export function applyCustomize(svg: string, c: CustomizeState): string {
  // 1) root <svg> width/height 갱신
  // 2) <g data-layer="stroke"> 의 stroke 속성 = darken(c.color, 0.6)
  //                         stroke-width 속성 = c.strokeWidth
  // 3) mode === 'linear': <g data-layer="fill"> 통째로 제거
  //    mode === 'duotone': <g data-layer="fill"> fill 속성 = c.color
}
```

`darken(color, amount)` 는 기존 `transform.ts` 의 함수 그대로 활용 (각 RGB 채널 × (1 - amount)).

핵심 변경:
- "currentColor 인지" 가 아니라 "`data-layer` 가 뭐인지" 로 분기
- linear 모드는 fill `<g>` 제거 (속성 변경이 아니라 통째 제거 — XML 단순)
- 면적 휴리스틱 사라짐

## 6. API 변경표

| Endpoint | 변경 | 비고 |
|---|---|---|
| `POST /api/icons/build-prompt` | **단순화**: 입력 `{ keyword, baseHex, description? }` → 출력 `{ prompt }`. ollama·library reference 제거 | 기존 출력의 `tokens`, `references` 필드 사라짐 — UploadModal 도 그 표시 제거 |
| `POST /api/icons/png-to-svg` | **신규**. `multipart/form-data` body 의 `file` (PNG) + `baseHex` field → `{ svg }` | `pngToSvg(buf)` 호출만. payload 크기 ≤ 10 MB |
| `POST /api/icons` | 그대로 | 변환된 SVG 와 메타 저장 |
| `GET /api/icons`, `DELETE /api/icons/[id]`, `POST /api/icons/[id]/restore` | 그대로 | |
| `POST /api/icons/generate` | **제거** | 직접 Ollama SVG 생성 — 새 흐름에서 사용 안 함 |

## 7. 컴포넌트 변경

### 7.1 `components/UploadModal.vue` — 전면 재작성

이전 paste 기반 흐름의 모든 잔재 제거. 4 step UI 가 모달 안에 single column 으로 배치:

| Step | UI 요소 |
|---|---|
| A | `<input>` keyword · `<input type="color">` base · `<textarea>` description · `<button>` "프롬프트 생성" |
| B | `<textarea readonly>` 생성된 prompt · `<button>` "프롬프트 복사" |
| C | `<input type="file" accept="image/png">` + 드롭존 · 업로드 progress · "변환" 버튼 (자동 호출도 가능) |
| D | inline `<svg>` 미리보기 · `<input>` name · `<input>` tags · `<input>` category · `<textarea>` description · `<button>` "등록" |

각 step 은 이전 step 의 데이터가 채워져야 활성화. step C 의 PNG 가 변환 실패하면 step D 비활성화 + 에러 메시지.

state 는 모달 내 로컬 ref 로 충분 (밖에서 재사용 안 됨).

### 7.2 `components/CustomizePanel.vue` — 최소 수정

- state 바인딩 그대로 (size · strokeWidth · mode · color)
- `mode` 의 라벨이 `default` → `duotone` 으로 변경
- 새 `applyCustomize` 시그니처에 맞춰 호출부 통일 (호출하는 위치들 — `IconDetailDialog.vue`, 그리드 미리보기 등)

### 7.3 `components/IconResultCard.vue` — 제거

기존 paste 결과 카드. 새 흐름에서는 step D 의 inline 미리보기로 대체. 파일 제거.

### 7.4 `components/IconCard.vue`, `IconDetailDialog.vue` — 호출부만 갱신

`applyCustomize(svg, customizeState)` 호출만 새 함수 시그니처에 맞춰 갱신. 외부 props/emits 변경 없음.

## 8. 제거되는 파일 / 코드

| 경로 | 처분 |
|---|---|
| `server/api/icons/generate.post.ts` | 파일 삭제 |
| `server/utils/iconPromptBuilder.ts` | 파일 삭제 (대체: `server/utils/buildPrompt.ts` — template 치환만 ~30줄) |
| `server/utils/iconLibraryIndex.ts` (만약 존재) | reference 수집 의존이라 함께 삭제 검토. **확인 task** 로 plan 에 포함 |
| `utils/svg/validate.ts` | paste 파싱 (`parseUploadInput`, `parseUploadList`) + `validateAndNormalizeSvg` 제거. `validateMeta` 와 `makeSlug` 는 유지 (메타 검증·slug 생성에 여전히 필요) |
| `utils/svg/transform.ts` | 전부 재작성 (§5) |
| `components/IconResultCard.vue` | 파일 삭제 |
| `components/PromptGuidePanel.vue` (만약 존재) | reference 표시 컴포넌트라면 삭제. **확인 task** |

## 9. 유지되는 파일 / 코드

- DB: `icons` 테이블 schema · FTS5 · `server/utils/db.ts` · `server/utils/repo/icons.ts`
- API: `GET /api/icons`, `POST /api/icons`, `DELETE /api/icons/[id]`, `POST /api/icons/[id]/restore`
- Stores: `stores/search.ts`, `stores/post.ts`, `stores/customize.ts` (state 동일, 단 `mode` 값 라벨만)
- Pages: 그대로
- Components 유지: `IconCard.vue`, `IconCreateCard.vue`, `IconDeletedCard.vue`, `IconDetailDialog.vue`, `IconGrid.vue`, `CustomizePanel.vue` (호출부만 갱신)
- Utils 유지: `utils/download.ts`, `utils/crypto.ts`, `utils/date.ts`, `utils/loading.ts`, `utils/shadcn.ts`, `utils/template.ts`, `utils/toast.ts`, `utils/validation.ts`, `utils/svg/validate.ts` 일부 (`validateMeta`, `makeSlug`)

## 10. 의존성

이미 설치됨:
- `potrace`
- `sharp`

Zhang-Suen thinning, line trace, Douglas-Peucker 는 자체 구현 (각 30~80줄). 외부 라이브러리 추가 없음.

## 11. 테스트 전략

| 테스트 파일 | 대상 | 핵심 케이스 |
|---|---|---|
| `tests/unit/imageProcessing/thinning.test.ts` | Zhang-Suen | 3×3 십자 → 십자 그대로 / 두꺼운 가로선 → 1px 가로선 |
| `tests/unit/imageProcessing/lineTrace.test.ts` | 8-connected trace | 십자 skeleton → 2 개 polyline / 4-junction 분기 |
| `tests/unit/imageProcessing/simplify.test.ts` | Douglas-Peucker | 일직선 위 점 N → 양 끝점만 / 곡선 점들 → 적절히 줄어듦 |
| `tests/unit/pngToSvg.test.ts` | 전체 통합 | 작은 합성 RGBA buffer → SVG 의 `data-layer="fill"`, `data-layer="stroke"` 존재 + path 개수 > 0 |
| `tests/unit/customize.test.ts` | 다운로드 transform | mode=duotone → fill·stroke 색 / mode=linear → fill `<g>` 제거 / strokeWidth 반영 |
| `tests/unit/buildPrompt.test.ts` | template 치환 | base_hex → stroke_hex 자동 계산 / description 빈 줄 처리 / 모든 placeholder 치환 |

기존 `tests/unit/svg.validate.test.ts` 는 `parseUploadList`/`validateAndNormalizeSvg` 제거와 함께 삭제. `validateMeta`/`makeSlug` 테스트만 새 파일로 분리하여 유지.

## 12. 합격 판정

1. 모든 단위 테스트 통과 (`pnpm test`)
2. dev 서버 (`pnpm dev`) 에서 UploadModal 의 step A → D 가 실제로 동작:
   - keyword `"결제"` + base color `#256BFA` → 정확한 prompt 텍스트 출력
   - 외부 LLM 의 PNG (사용자가 보낸 fixture 와 같은 형식) 업로드 → 변환 결과 SVG 미리보기 표시 → 등록 성공
3. 등록된 아이콘이 라이브러리 그리드에 나타나고, IconDetailDialog 에서 customize 가 동작 (size · strokeWidth · mode toggle · color 변경 시 즉시 반영)
4. linter / type check 통과 (`pnpm lint`, nuxt prepare)

## 13. 작업 분해 힌트 (writing-plans 단계 입력)

대략적인 task 그룹 (정확한 분해는 plan 에서):

1. **Image processing 알고리즘** (thinning · lineTrace · simplify) + 단위 테스트 — 가장 격리 가능, 먼저
2. **변환 모듈 `pngToSvg.ts`** + 단위 테스트
3. **새 transform `applyCustomize` 재작성** + 단위 테스트
4. **새 buildPrompt** + 단위 테스트
5. **API endpoints 변경 (build-prompt 단순화 / png-to-svg 신규 / generate 제거)**
6. **UploadModal.vue 전면 재작성**
7. **호출부 갱신 (IconDetailDialog, IconCard 등)**
8. **제거 대상 파일 일괄 삭제** (마지막 단계 — 잔존 import 발견 시 수정)
