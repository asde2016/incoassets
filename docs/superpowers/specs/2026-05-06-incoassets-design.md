# incoassets — 사내 SVG 자산 공유 플랫폼 디자인

- 작성일: 2026-05-06
- 상태: Draft (사용자 리뷰 대기)
- 작성: 브레인스토밍 합의 결과
- 대상 디렉토리: `/Users/choejaemin/Desktop/work/incoassets` (Nuxt 4 스타터 위에 구현)

---

## 1. 시스템 개요

**한 줄 정의**
사내 사용자가 SVG 아이콘을 **업로드·검색·다운로드**하는 단일 Nuxt 앱. 외부 AI(Claude / ChatGPT / Gemini 등)로 표준 SVG를 만들고 싶은 사용자에게 **프롬프트 가이드를 제공**하지만, AI 호출 자체는 우리 서버 책임이 아니다.

**구성 요소**

- Nuxt 4 단일 앱 (SSR, `nuxt build` 빌드 → Node 서버 배포)
- Nitro server routes
- SQLite (`better-sqlite3` + FTS5 trigram tokenizer)
- 인증 없음 (사내망 가정), creator 추적 없음
- LLM과 통신하지 않음 (서버에 LLM API 키 환경변수 없음)

**기존 스타터에서 사용/무시할 것**

- 사용: Vue 3, TypeScript, Tailwind, shadcn-nuxt, Pinia(`pinia-plugin-persistedstate`), `@vueuse/core`, `vue-sonner`, `zod`
- 무시: `iconfont/`(SVG → 아이콘 폰트 변환 파이프라인), `stores/auth.ts`, `pages/login.vue`, `middleware/`(인증 미들웨어), `pages/post/`, `pages/template.vue`(샘플)

**기술적 함의 — `nuxt generate` → `nuxt build`**

현재 `package.json` 의 `build` 가 `nuxt generate`(정적 사이트)인데, SQLite 접근에 Nitro server runtime이 필요하므로 `nuxt build` 로 변경. `nuxt.config.ts` 의 `routeRules.'/api/**'.proxy` 도 제거(외부 백엔드 안 씀).

---

## 2. 사용자 시나리오

1. **검색 · 다운로드**
   `/` 진입 → 키워드 입력 → 그리드 표시 → 우측 Customize 패널에서 size/stroke/색상 모드 조정(그리드 실시간 반영) → 카드 클릭 시 현재 패널 값 그대로 SVG 다운로드.

2. **업로드** (외부 AI로 만들었거나 디자이너가 export한 SVG)
   그리드 첫 자리 **"+" 업로드 카드** 클릭 → 업로드 모달 → SVG 입력(텍스트 paste 또는 `.svg` 파일) → 즉시 §4 표준 검증 + 라이브 미리보기 → 메타데이터(이름·태그·카테고리) → **저장** → 라이브러리에 즉시 추가(검색 결과에 노출).

3. **외부 AI 사용자 보조**
   업로드 모달의 가이드 패널에서 [📋 프롬프트 복사] → 사용자가 자기 Claude/ChatGPT/Gemini에 붙여넣기 → 결과 SVG(또는 JSON 페이로드)를 모달에 paste.

4. **재사용**
   다른 사용자가 같은 키워드 검색 시 누군가 이미 등록한 아이콘이 결과로 등장.

5. **삭제**
   카드 hover 시 우상단 `×` 버튼 → confirm 다이얼로그 → hard delete.

---

## 3. 페이지 / UI 구조

### 3.1 라우트

- `/` 단일 라우트 (`pages/index.vue`).
- 인증 페이지/미들웨어 비활성. `pages/login.vue`, `middleware/` 는 v1에서 사용 안 함.
- 업로드는 별도 라우트 없이 모달로 처리.

### 3.2 메인 페이지 레이아웃 (Feather UI 그대로)

```
┌─ Header (로고만, 우측 다크모드 토글) ──────────────────────┐
├─ Hero (가운데 타이틀 + 짧은 설명) ─────────────────────────┤
├─ Body 2-column ────────────────────────────────────────────┤
│  ┌─ 좌: 검색 + 그리드 ───────┐ ┌─ 우: Customize ─────────┐ │
│  │  🔍 Search bar (풀폭)     │ │  Size      24px         │ │
│  │  ┌───┬───┬───┬───┬───┐   │ │  Stroke    2px          │ │
│  │  │ + │ ic│ ic│ ic│ ic│   │ │  Color [Solid|Gradient] │ │
│  │  ├───┼───┼───┼───┼───┤   │ │  Reset                  │ │
│  │  │ ic│ ic│ ic│ ic│ ic│   │ └─────────────────────────┘ │
│  │  └───┴───┴───┴───┴───┘   │                             │
│  └───────────────────────────┘                             │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Header (`components/layouts/Header.vue`)

- 좌측: 로고/타이틀 (`incoassets`)
- 우측: 다크모드 토글
- [+ Create] 같은 액션 버튼은 두지 않음. 업로드 진입은 그리드 첫 카드.

### 3.4 Hero

- 가운데 정렬 타이틀 + 한 줄 설명. Feather 의 [Get started] / [Download all] 버튼은 v1에 두지 않음.

### 3.5 검색바

- 풀폭, 자동 포커스, `/` 키 단축키.
- 입력값은 글로벌 store에 저장. 업로드 모달의 가이드 prefill, "+" 카드 라벨이 이 값과 연동.
- 입력 디바운스 300ms, AbortController 로 이전 요청 취소.

### 3.6 그리드

- 반응형 컬럼 (Tailwind 기준):
  `xl:grid-cols-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2`.
- 모든 카드 동일 크기 (정사각형, Feather 와 동일 패딩/보더).
- 페이지네이션: OFFSET 기반 무한 스크롤 (페이지 60개). 응답의 `hasMore` 가 false 가 될 때까지 다음 페이지 요청.

#### 3.6.1 첫 카드 — "+" 업로드 카드

- 다른 카드와 동일 크기/스타일.
- 라벨 동적:
  - 검색어 없음: `+ 새 아이콘 업로드`
  - 검색어 있음: `+ "<keyword>" 업로드`
- 클릭 시 업로드 모달 (검색어가 있으면 가이드 프롬프트의 KEYWORD 슬롯과 메타데이터 폼에 prefill).

#### 3.6.2 일반 아이콘 카드

- 가운데에 SVG 라이브 미리보기 (글로벌 Customize 적용), 하단에 이름.
- Hover:
  - 카드 본체 강조 (그림자/보더)
  - 우상단 `×` 버튼 노출 (삭제). `stopPropagation` 으로 카드 본체 클릭(다운로드)과 분리.
- 카드 본체 클릭 = 현재 Customize 값 적용된 SVG 다운로드.

### 3.7 Customize 패널 (sticky 우측)

- `position: sticky; top: <header-h>;`
- **Size** 슬라이더: 16~64px (기본 24)
- **Stroke width** 슬라이더: 0.5~3px (기본 2)
- **Color 모드 탭**: `[Solid | Gradient]`
  - Solid: 컬러 1개
  - Gradient: start 컬러 + end 컬러 + angle (0~360°) 슬라이더
- **Reset** 버튼: 모든 값 기본값 복원
- 모든 값은 Pinia store 글로벌 상태. 그리드 카드 미리보기와 다운로드가 동일 store를 구독.

### 3.8 업로드 모달

```
┌─ Upload SVG ─────────────────────────────────────────────────┐
│                                                              │
│  ┌─ 좌: 프롬프트 가이드 (접힘 가능) ──┐ ┌─ 우: SVG 입력 ─┐  │
│  │ 검색어 prefill 프롬프트 미리보기   │ │ [Paste|File]   │  │
│  │ - SVG 표준 §4 가이드라인 본문      │ │  ┌─────────┐   │  │
│  │ - JSON 출력 스키마                 │ │  │ <svg…/> │   │  │
│  │ [📋 프롬프트 복사]                 │ │  └─────────┘   │  │
│  └────────────────────────────────────┘ └────────────────┘  │
│                                                              │
│  ─── 미리보기(Customize 적용) ────────────────────────────── │
│                                                              │
│  ─── 메타데이터 폼 ────────────────────────────────────────  │
│  이름   [_________________]   카테고리 [_________________]  │
│  태그   [aws, cloud, server   (쉼표 구분)]                  │
│  (입력값에 JSON 메타데이터가 함께 있으면 자동 파싱하여 채움)│
│                                                              │
│  [취소]                                            [저장]    │
└──────────────────────────────────────────────────────────────┘
```

- **Paste 탭**: textarea에 `<svg>...</svg>` 또는 `{ name, tags, category, svg }` JSON 문자열을 붙여넣기. JSON으로 해석되면 메타데이터 폼 자동 채움.
- **File 탭**: `.svg` 드래그앤드롭 또는 파일 선택. 파일 텍스트로 변환 후 동일 검증.
- 입력 즉시 §4 검증 + 미리보기. 위반 시 위반 규칙 목록 표시(빨간 경고).
- "저장" 버튼은 검증 통과 + 이름 비어있지 않을 때만 활성.

---

## 4. SVG 표준 구조 & Customize 적용 규칙

### 4.1 라이브러리 저장 표준

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <!-- 모든 도형은 루트 직속. 그룹 구분 없음 -->
  <path d="..."/>
  <circle ... />
  <!-- 채움이 필요한 도형은 fill="currentColor" 명시 -->
  <path d="..." fill="currentColor"/>
</svg>
```

**규칙**

- `viewBox="0 0 24 24"` 고정. `width`/`height` 속성 없음(다운로드 시 주입).
- 루트 기본값: `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`.
- 색상 표현은 **`currentColor` sentinel** 만 허용. 임의 hex/named color, rgb(), hsl() 금지.
  - 라인은 루트 stroke 상속.
  - 채움이 필요한 도형은 `fill="currentColor"` 직접 명시.
- 허용 도형: `<path>`, `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, `<ellipse>`. `<g>` 는 자동 평탄화.
- 금지: `<defs>`, `<linearGradient>`, `<radialGradient>`, `<pattern>`, `<mask>`, `<clipPath>`, `<filter>`, `<use>`, `<image>`, `<script>`, `<foreignObject>`, `<iframe>`, `<a>`, `<style>`, inline `style` 속성, `on*` 이벤트 핸들러, 외부 URL `xlink:href`/`href`/`javascript:` URI.
- 도형 수: 1~30개 (g 평탄화 후 카운트).
- 페이로드: 50KB 이하.

### 4.2 Customize 적용 변환 규칙

입력: 표준 SVG + `{ size, strokeWidth, colorMode, colors }`
출력: 변환된 SVG 문자열

**공통**

- 루트에 `width="<size>"`, `height="<size>"` 주입.
- 루트 `stroke-width` 를 `<strokeWidth>` 로 갱신.

**(a) Solid** — `colors = { color }`

- SVG 내부 모든 `currentColor` 토큰을 `<color>` 로 치환. (`stroke`, `fill` 어디에 있든 일괄 치환.)

**(b) Gradient** — `colors = { start, end, angle }`

- `<defs>` 에 `<linearGradient id="g_<uid>" gradientUnits="userSpaceOnUse" x1=".." y1=".." x2=".." y2="..">` 정의.
  - `x1,y1,x2,y2` 는 angle 기반으로 24×24 좌표계에서 계산.
  - `<stop offset="0%" stop-color="<start>"/>` + `<stop offset="100%" stop-color="<end>"/>`.
- 모든 `currentColor` 토큰을 `url(#g_<uid>)` 로 치환.
- `<uid>` 는 변환 시점 random suffix(한 페이지에 여러 SVG 임베드 시 id 충돌 방지).

### 4.3 단일 진실 원칙

`utils/svg/transform.ts` 에 변환 함수 1개. 그리드 라이브 미리보기와 다운로드가 동일 함수를 호출 → "본 그대로 다운로드" 보장.

### 4.4 다운로드 파일명

- `<slug>.svg` (예: `aws-cloud.svg`).
- slug는 INSERT 시점에 서버에서 결정한 값을 그대로 사용.
- v1은 단일 다운로드만. ZIP 묶음 다운로드는 v1.1 후속.

### 4.5 24×24 viewBox 고정

- v1은 24×24 고정. 외부 AI 출력도 강제 → 라이브러리 일관성.

---

## 5. 데이터 모델 (SQLite)

### 5.1 파일/마이그레이션

- 파일 위치: `data/icons.db` (gitignore 처리). 환경변수 `DB_PATH` 로 override 가능.
- 라이브러리: `better-sqlite3`.
- 초기화: `server/plugins/db.ts` 가 부팅 시 `IF NOT EXISTS` 마이그레이션을 idempotent 하게 실행. 별도 마이그레이션 도구는 v1 스코프 외.

### 5.2 스키마

```sql
CREATE TABLE IF NOT EXISTS icons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,                 -- 표시명
  slug        TEXT    NOT NULL UNIQUE,          -- 다운로드 파일명
  category    TEXT    NOT NULL DEFAULT '',
  tags_json   TEXT    NOT NULL DEFAULT '[]',    -- JSON 배열 문자열
  tags_text   TEXT    NOT NULL DEFAULT '',      -- tags_json 의 공백 join 캐시 (FTS 인덱스용)
  svg         TEXT    NOT NULL,                 -- 정규화·검증된 표준 SVG
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_icons_created_at ON icons(created_at DESC);

-- FTS5 가상 테이블 (trigram tokenizer = 한국어/영어 부분 일치)
CREATE VIRTUAL TABLE IF NOT EXISTS icons_fts USING fts5(
  name, tags, category,
  content='icons', content_rowid='id',
  tokenize='trigram'
);

-- 동기화 트리거
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
```

### 5.3 검색 쿼리 패턴

```sql
-- q 가 있을 때
SELECT i.id, i.name, i.slug, i.category, i.tags_json, i.svg, i.created_at
FROM icons i
JOIN icons_fts f ON f.rowid = i.id
WHERE icons_fts MATCH :q
ORDER BY rank, i.created_at DESC
LIMIT :limit OFFSET :offset;

-- q 가 비어있을 때
SELECT id, name, slug, category, tags_json, svg, created_at
FROM icons
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
```

페이징은 v1에서 `LIMIT/OFFSET` 으로 시작. 라이브러리가 커지면 cursor(`created_at + id`) 기반으로 전환.

### 5.4 Slug 생성 / 충돌 처리

- `name` → 영숫자/하이픈만 남기고 lowercase + 하이픈 변환.
- 한글은 transliteration이 어려우므로 슬러그가 빈 문자열이면 fallback `icon-<nanoid 6자>` (id에 의존하지 않음 → INSERT 한 번에 결정).
- UNIQUE 충돌 시 `name-2`, `name-3` ... INSERT retry (최대 5회). 모두 실패 시 `name-<nanoid 6자>` 로 fallback.

### 5.5 안 만드는 것 (YAGNI)

- 별도 `tags`, `icon_tags` 정규화 테이블.
- `users`, `creators`, 권한.
- `audit_log`, soft-delete.
- ZIP 캐시.
- `prompt` 컬럼 (외부 AI로 만든 거라 우리가 알 수 없음).

---

## 6. API 설계 (Nitro server routes)

모든 라우트는 `server/api/...` 위치. 인증 없음. JSON 응답.

### 6.1 라우트 목록

```
GET    /api/icons          목록/검색 (페이지네이션)
POST   /api/icons          업로드 (검증된 SVG + 메타데이터를 INSERT)
DELETE /api/icons/:id      삭제 (hard delete)
```

### 6.2 요청/응답 스펙

#### `GET /api/icons`

- Query: `q` (string, optional), `offset` (number, default 0), `limit` (number, default 60, max 120)
- 동작:
  - `q` 있음 → FTS5 trigram MATCH (q를 토큰화 후 `tokenA* tokenB*` 형태). `rank` + `created_at DESC` 정렬.
  - `q` 없음 → 전체 `created_at DESC`.
- 응답:

```json
{
  "items": [
    {
      "id": 12,
      "name": "AWS Cloud",
      "slug": "aws-cloud",
      "category": "cloud",
      "tags": ["aws", "cloud", "server"],
      "svg": "<svg ...>...</svg>",
      "createdAt": "2026-05-06T10:00:00.000Z"
    }
  ],
  "hasMore": true
}
```

#### `POST /api/icons` (업로드)

- Body:

```json
{
  "name": "AWS Cloud",
  "tags": ["aws", "cloud", "server"],
  "category": "cloud",
  "svg": "<svg ...>...</svg>"
}
```

- 동작:
  1. zod 입력 스키마 검증.
  2. SVG 검증 + 정규화 (§4, §7) — `validateAndNormalizeSvg(svg)`.
  3. slug 생성 + 충돌 시 suffix retry.
  4. `tags_text = tags.join(' ')` 함께 INSERT (FTS5 트리거가 자동 동기화).
  5. 생성된 row 반환.
- 응답: 단일 icon 객체.

#### `DELETE /api/icons/:id`

- 동작: `DELETE FROM icons WHERE id = ?` (트리거가 FTS5 동기화).
- 응답: `204 No Content` 또는 `{ "ok": true }`. 미존재 시 `404`.

### 6.3 에러 응답 표준

```json
{ "error": { "code": "INVALID_SVG", "message": "viewBox는 0 0 24 24 여야 합니다" } }
```

코드 예: `INVALID_INPUT`, `INVALID_SVG`, `NOT_FOUND`, `INTERNAL`. `LLM_*` 코드는 v1에 없음.

### 6.4 Rate limiting

- v1에서는 두지 않음. 사내망 + LLM 호출 없음 → 비용 위험 없음. 향후 도입 시 generate 라우트 부재로 단순.

### 6.5 환경변수

- `DB_PATH` — SQLite 파일 경로 (기본 `./data/icons.db`)
- LLM 관련 환경변수 일체 없음.

### 6.6 `nuxt.config.ts` 변경

- `routeRules['/api/**'].proxy` **제거**.
- `ssr: true` 유지. `nitro.prerender.crawlLinks` 비활성 또는 주요 페이지 화이트리스트만.
- `package.json` 의 `build` 를 `nuxt generate` → `nuxt build` 로 변경.

---

## 7. 프롬프트 가이드라인 + SVG 검증 정책

### 7.1 사용자 노출용 프롬프트 가이드 (업로드 모달 좌측 패널)

검색어가 있으면 `<KEYWORD>` 자리에 prefill. [📋 복사] 버튼이 아래 텍스트 전체를 클립보드에 복사.

````
You are an SVG icon generator. Output ONLY a single JSON object that matches the schema below. No prose, no code fences, no explanations.

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
10. 출력에 ```json 같은 코드펜스를 두지 마라. 순수 JSON 한 덩어리만 출력.

EXAMPLE (참고용, KEYWORD과 무관):
{
  "name": "Cloud",
  "tags": ["cloud", "weather", "storage"],
  "category": "system",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 5 12.5 4.5 4.5 0 0 0 6.5 21h11Z\"/></svg>"
}
````

가이드 텍스트는 `composables/promptGuide.ts` 단일 상수로 관리. `buildPrompt(topic)` 헬퍼가 `<KEYWORD>` 슬롯을 치환.

### 7.2 입력 해석 순서 (모달 + 서버 공용)

````
입력 문자열
  ├─ 코드펜스 strip (```json ... ``` 자동 제거)
  ├─ JSON.parse 시도
  │   └─ 성공 + 스키마 일치 → { name, tags, category, svg } 추출
  │       └─ svg 필드를 SVG 검증으로 진행, 메타데이터는 폼에 prefill
  └─ 실패
      └─ 입력 전체에서 첫 <svg>...</svg> 매치 추출
          └─ SVG 검증으로 진행. 메타데이터 폼은 사용자가 직접 입력
````

### 7.3 SVG 검증 (`validateAndNormalizeSvg`)

라이브러리: 서버는 `fast-xml-parser`. 클라이언트는 동일 모듈을 import.

**거절 규칙 (위반 시 INVALID_SVG)**

- 루트 `<svg>` 1개만, namespace `http://www.w3.org/2000/svg`.
- `viewBox` 속성이 `"0 0 24 24"` 와 정확 일치.
- 화이트리스트 외 노드 발견.
- 화이트리스트 외 속성 발견(`on*`, `style`, `xlink:href`/`href` 외부 URL, `javascript:` URI).
- 색상 속성(`fill`, `stroke`, `stop-color` 등) 값이 `none` / `currentColor` 외.
- 페이로드 50KB 초과.
- 도형 수 0개 또는 31개 이상 (`<g>` 평탄화 후).

**자동 정규화 (거절 없이 정리)**

- 루트 속성 표준화: `xmlns`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- `width`/`height` 속성 제거.
- `<g>` 평탄화 (자식 도형만 루트로).
- 화이트리스트 외 속성 제거 (`data-*`, `id`, 임의 namespace 속성 등).
- 빈 도형(빈 `d`, 길이 0) 제거.
- 출력 직전 minify (불필요 공백 제거).

**에러 메시지 형식 (사용자 노출)**

```
INVALID_SVG: 다음 규칙을 위반했습니다.
  - viewBox는 "0 0 24 24" 여야 합니다 (현재: "0 0 32 32")
  - 색상은 currentColor만 허용됩니다 (발견: #1E88E5)
  - 금지된 노드: <linearGradient>
```

### 7.4 메타데이터 검증

- `name`: 1~64자, 양끝 trim, 빈 문자열 거절.
- `tags`: 0~20개, 각 1~30자, lowercase 변환, 중복 제거.
- `category`: 0~30자, 양끝 trim.

### 7.5 보안

- `v-html` 인라인 렌더링 사용 → 검증은 **거절 정책** (자동 strip 아님).
- 클라이언트와 서버가 동일 모듈로 두 번 검증 (defense in depth).

### 7.6 모듈 위치

- `utils/svg/validate.ts` — `validateAndNormalizeSvg(input)` (클·서버 공용).
- `utils/svg/transform.ts` — Customize 적용 변환 (미리보기·다운로드 공용).
- `composables/promptGuide.ts` — 가이드 텍스트 상수, `buildPrompt(topic)`.
- `server/api/icons/index.post.ts` — 업로드 엔드포인트.
- `server/api/icons/index.get.ts` — 검색·목록 엔드포인트.
- `server/api/icons/[id].delete.ts` — 삭제 엔드포인트.
- `server/plugins/db.ts` — DB 초기화·마이그레이션.

---

## 8. 다운로드 흐름

### 8.1 트리거

- 그리드 카드 본체 클릭.
- (선택) 카드 hover 영역의 다운로드 아이콘 클릭 — 본체 클릭과 동일.

### 8.2 단일 변환·다운로드 함수

```ts
// utils/svg/transform.ts
export function applyCustomize(
  svgText: string,
  c: {
    size: number;
    strokeWidth: number;
    mode: 'solid' | 'gradient';
    colors: SolidColors | GradientColors;
  }
): string;

// utils/download.ts
export function downloadSvg(slug: string, svgText: string): void;
```

- 미리보기와 다운로드 모두 `applyCustomize` 동일 함수 사용.

### 8.3 다운로드 메커니즘

표준 Blob + `<a download>` 트릭:

```ts
const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${slug}.svg`;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
```

### 8.4 미리보기 ↔ 다운로드 동기 보장

- 카드는 변환 결과 SVG를 `v-html` 인라인 렌더.
- Customize store 변경 시 모든 카드 리렌더. 카드 수가 매우 크면 `requestIdleCallback` 기반 디바운스 150ms로 변환 부하 분산.

---

## 9. 에러 처리 & 엣지 케이스

### 9.1 사용자 흐름

| 상황                        | 처리                                                                         |
| --------------------------- | ---------------------------------------------------------------------------- |
| 라이브러리 비어 있음 (초기) | 그리드에 "+" 카드만 노출. Hero 아래 "사내 첫 아이콘을 업로드해 보세요" 안내. |
| 검색 결과 0건               | "+" 카드 + "검색 결과가 없습니다. 위 카드로 새로 등록해 보세요." 메시지.     |
| 같은 키워드 빠른 연속 입력  | 디바운스 300ms + AbortController.                                            |
| 매우 긴 라이브러리          | 무한 스크롤 페이지 60. 미리보기 변환은 디바운스로 제한.                      |

### 9.2 업로드 엣지

| 상황                                   | 처리                                                               |
| -------------------------------------- | ------------------------------------------------------------------ |
| AI가 코드펜스(`json ... `)로 감싼 출력 | 자동 strip 후 JSON.parse 재시도.                                   |
| JSON 파싱 실패                         | 입력 전체를 SVG 단독으로 해석. 메타데이터 폼 비움.                 |
| SVG 외 잡설 섞임                       | `/<svg[\s\S]*?<\/svg>/i` 첫 매치 추출 후 검증.                     |
| viewBox 24×24 불일치                   | INVALID_SVG. 명확한 메시지 노출.                                   |
| 색상에 hex/rgb 발견                    | INVALID_SVG. 자동 치환 안 함 (의도된 디자인일 수 있음).            |
| 50KB 초과                              | INVALID_SVG. 크기 표시.                                            |
| 도형 30개 초과                         | INVALID_SVG.                                                       |
| 한글 name                              | 슬러그가 빈 문자열이면 `icon-<nanoid 6자>` fallback.               |
| slug 충돌                              | `slug`, `slug-2`, `slug-3` retry.                                  |
| 동일 SVG 재업로드                      | v1에서 차단 안 함 (중복 허용). 후속에서 SVG hash 인덱스 도입 가능. |

### 9.3 시스템 엣지

| 상황                                | 처리                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `data/icons.db` 부재                | 부팅 시 nitro plugin이 IF NOT EXISTS 마이그레이션으로 생성.                        |
| DB 파일 권한 오류                   | 부팅 즉시 fail-fast (콘솔 에러 + exit).                                            |
| `better-sqlite3` 네이티브 빌드 실패 | README에 Node 22 + prebuilt 안내.                                                  |
| 동시 INSERT 경합                    | better-sqlite3 자동 직렬화. v1 부하 가정상 lock 이슈 없음.                         |
| FTS5 미지원 SQLite 빌드             | 부팅 시 `SELECT fts5(?1)` 시도하여 fail-fast. better-sqlite3 prebuilt는 FTS5 포함. |

### 9.4 보안 엣지 (XSS)

- `v-html` 인라인 렌더링. `<script>`, `on*` 등 위험 노드는 검증에서 거절.
- 클라이언트도 같은 검증을 수행 (defense in depth).

---

## 10. 테스트 전략

### 10.1 도구

- Unit / Component: **Vitest** + `@vue/test-utils`.
- API 통합: **Vitest** + 임시 better-sqlite3 파일 DB.
- E2E (선택, v1.1): **Playwright**.

### 10.2 우선순위

**P0 (반드시 v1)**

- `utils/svg/validate.ts` — 위반 케이스 망라:
  - viewBox 불일치, 금지 노드(<script>, <linearGradient> 등), hex/rgb 색상, on\* 핸들러, 50KB 초과, 도형 0/31개.
  - JSON 페이로드 파싱(스키마 일치/불일치), 코드펜스 strip, SVG 추출.
- `utils/svg/transform.ts` — Solid 치환, Gradient defs 주입, uid 충돌 회피, size/stroke 주입, 멱등성.
- `server/api/icons/index.post.ts` — 정상/거절/슬러그 충돌 retry/FTS5 동기화 통합.
- `server/api/icons/index.get.ts` — q 있음/없음, 페이지네이션.
- `server/api/icons/[id].delete.ts` — 정상/404/FTS5 동기화.

**P1**

- 그리드 카드 컴포넌트 (미리보기, hover, 클릭 다운로드, × 삭제 confirm).
- 업로드 모달 (Paste/File 탭, JSON prefill, 검증 메시지, 저장 버튼 활성화 조건).
- Customize 패널 (Solid ↔ Gradient 탭, Reset).

**P2 (후속)**

- E2E: 업로드 → 검색 → 다운로드 → 삭제 골든 패스.

### 10.3 픽스처

- `tests/fixtures/svg/valid/*.svg` — 5~10개의 표준 통과 SVG.
- `tests/fixtures/svg/invalid/*.svg` — 위반 규칙별 1개씩.

### 10.4 CI

- v1: `pnpm lint` + `pnpm format` + `pnpm test` (Vitest).
- 별도 CI 셋업은 후속.

---

## 11. 부록 — 변경 사항 요약

### 11.1 `package.json`

- `scripts.build`: `nuxt generate` → `nuxt build`.
- `dependencies` 추가: `better-sqlite3`, `fast-xml-parser`, `nanoid`.
- `devDependencies` 추가: `@types/better-sqlite3`, `vitest`, `@vue/test-utils`.

### 11.2 `nuxt.config.ts`

- `routeRules['/api/**'].proxy` 제거.
- `ssr: true` 유지.
- `nitro.prerender.crawlLinks` 비활성 또는 안전한 화이트리스트만.

### 11.3 `.gitignore`

- `data/` 추가 (SQLite 파일 보호).

### 11.4 새 파일

```
composables/
  promptGuide.ts
server/
  api/
    icons/
      index.get.ts
      index.post.ts
      [id].delete.ts
  plugins/
    db.ts
  utils/
    db.ts                  // better-sqlite3 인스턴스 생성/공유
    repo/icons.ts          // INSERT/SELECT/DELETE prepared statements
stores/
  customize.ts             // Customize 패널 상태
  search.ts                // 검색어/페이징 상태
utils/
  svg/
    validate.ts
    transform.ts
  download.ts
components/
  IconGrid.vue
  IconCard.vue
  IconCreateCard.vue
  CustomizePanel.vue
  UploadModal.vue
  PromptGuidePanel.vue
tests/
  fixtures/svg/valid/*.svg
  fixtures/svg/invalid/*.svg
  unit/svg.validate.test.ts
  unit/svg.transform.test.ts
  api/icons.test.ts
```

### 11.5 비활성/제거 대상 (v1에서 사용 안 함)

- `pages/login.vue`
- `middleware/` 인증 미들웨어
- `stores/auth.ts`
- `pages/post/`, `pages/template.vue`
- `iconfont/` (그대로 두되 빌드 파이프라인에서 무시)

---

## 12. 비스코프 (v1에 안 만드는 것)

- 인증 / 사용자 / creator 추적
- 라이브러리 검수·승인 워크플로우, 신고 기능
- 라이브러리 ZIP 묶음 다운로드
- 즐겨찾기 / 컬렉션
- AI 자동 생성 (서버 LLM 호출)
- AI 모델 선택 / OAuth / BYOK
- 동일 SVG 중복 차단 (hash 인덱스)
- 별도 tags / icon_tags 정규화 테이블
- 시맨틱 검색 (벡터)
- 다국어 i18n (UI 한국어 기준 단일)
- soft-delete / audit log
- 운영 모니터링 / Rate limiting

---
