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
9. 최상위는 { "items": [...] } 객체. raw array만 두는 것 금지, 코드펜스(\`\`\`json … \`\`\`) 금지, 어떠한 prose도 금지.
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
  return PROMPT_GUIDE_TEMPLATE.replace('<KEYWORD>', safeKeyword)
    .replace('<DESC_BLOCK>', descBlock)
    .replaceAll('<COUNT>', String(safeCount));
}
