export const PROMPT_GUIDE_TEMPLATE =
  `You are an icon designer creating *original* duotone outline icons in the **Phosphor Duotone / iconoir / Solar Linear** tradition. Each icon is a **creative interpretation** of the KEYWORD — never a template copy. Output ONLY a single JSON object containing an "items" array — no prose, no code fences, no commentary.

KEYWORD: <KEYWORD>
<DESC_BLOCK>
## Brief
- Canvas: viewBox **0 0 512 512**.
- Safe area: x=40..472, y=40..472 (사방 40 unit margin).
- **Optical center**: (256, 256). 주제 객체의 *시각 무게중심*을 이 점에서 ±64 unit 안에 둔다. 좌표상 중앙이 아니라 *광학* 중심 — 큰 surface가 한쪽에 쏠리면 반대편에 marker로 보정.
- **Composition grid**: 객체의 외곽/중심 *앵커*는 8 unit 배수 권장 (8/16/24/40/64/80/96/128/256…). anatomy 디테일은 자유 좌표 OK.
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
- **Set Consistency** (구도는 달라도 *세트감*은 유지):
  - 모든 item의 시각 무게중심이 광학 중심 (256,256)에서 ±64 unit 안.
  - 모든 item의 *총 fill 면적 합*이 평균값의 ±30% 안 — 한 개만 너무 비거나 너무 빽빽하면 안 됨.
  - 객체당 anatomy 개수가 6~10 범위에서 골고루. 한 item만 6개·다른 한 item만 10개 같은 극단 배치 금지.
  - 모든 item이 동일한 stroke-width 6 상속만 사용 (개별 override 금지).

## Stroke (단일)
- 모든 shape는 root 상속 stroke-width 6. 표시 96px 기준 ~1.1px (사실상 1px).
- 같은 굵기를 일관되게. 두께 변화 금지.

## Curve & Path Quality
- 직선이면 직선으로. <path>의 Q/C로 직선 모방 금지.
- 원·호는 <circle>·<ellipse> 사용. path가 필요하면 **A 명령**으로. C로 원을 4-segment 근사하지 마라 (윤곽이 둥글지 않고 다각형처럼 보임).
- 자유 곡선의 베지에 **핸들은 대칭**. 한쪽 핸들만 길면 윤곽이 꺾인다 — 같은 노드에서 들어오는 핸들과 나가는 핸들의 *방향과 길이를 정렬*.
- 동일 곡률을 잇는 연속 segment는 **S/T 명령**으로 매끄럽게 잇는다 (핸들 재계산 부담 줄고 자연스러움).
- **같은 직선 위에 점 3개 이상 두지 마라** — 중간 노드는 불필요. polyline/path 노드 수를 의미 단위로 최소화.
- 좌표 정렬:
  - 직교 가장자리(rect/line의 x,y, axis-aligned 단순 path 절점): **정수**, 4 또는 8 배수 선호.
  - 자유 곡선의 제어점: 정수 또는 .5.
  - stroke 중심선이 픽셀 사이에 걸리지 않도록 — 정수 좌표가 기본.

## Duotone Color (가장 중요 — 정확히 따를 것)
사용자는 단일 color 1개만 고른다. 렌더 파이프라인:
- **fill=currentColor → 선택 색상 그대로** (full opacity) — *진한 내부 본색*. 면적 무관, 큰 surface도 작은 marker도 동일하게 풀컬러.
- **stroke=currentColor → 선택 색상을 45% 어둡게 한 라인** — fill 위에 얹히는 *더 짙은 윤곽*. 자동으로 짙어지므로 너는 명시하지 않는다.
- **fill 미지정/none → outline only** — stroke만 보임 (짙은 라인 단독).

⚠️ 핵심 — *Fill-heavy 듀오톤 스타일* (Flaticon Blue Duotone 패밀리):
- 이 시스템은 **fill을 적극적으로 쓸수록 잘 보인다**. outline-only만으로는 짙은 라인 1줄뿐이라 빈약해 보임.
- 대다수 객체는 두 가지 패턴 중 하나로 그린다:
  1. **filled body**: 본체 자체에 fill="currentColor" — 진한 본색으로 채워지고 더 짙은 라인이 윤곽을 그림 (말풍선·뱃지·강조 컨테이너·서버 LED 슬롯 등).
  2. **outline body + inner surface**: 본체 outline + 내부 주요 surface에 fill="currentColor" — 폰 body는 outline, 폰 화면 rect는 fill (가장 흔한 디바이스 패턴).
- 작은 의미 표지 (헤더 dot, 키홀, 인디케이터, ▶, 체크 ✓, 노치 점): **fill="currentColor"** + 작은 r/wh → 동일한 진한 본색.
- 핵심 규칙: *각 객체마다 최소 1개의 fill="currentColor" 영역*. 모든 객체가 outline-only면 듀오톤이 살지 않는다.

❌ 안 되는 것:
- 모든 객체가 outline only (라인만 가는 짙은 줄 → 약하고 비어 보임).
- 모든 객체가 filled body (전체가 진한 블롭 → 답답함).
- fill 위에 "더 밝은" 강조선을 기대하는 것 — 라인은 *어두워진다*, 밝아지지 않는다.

✅ 정답 패턴: 본체 outline + 내부 surface fill, 또는 큰 강조 객체(말풍선·뱃지)에 filled body, + 작은 마커 fill.

## Composition
- 객체 1~4개 (4 초과 금지). 각 객체는 *6~10개의 기능적 anatomy*를 가진다 — silhouette 환원 금지. (4~5개는 너무 비어 보임, 11+ 는 시각 노이즈)
- ⚠️ "minimal" angle 의미: *객체 수*를 줄이는 것 (예: 인물 + 도구 → 인물만). *객체 내 anatomy 수는 줄이지 않는다*. minimal 인물도 머리·눈·안경·가운·라펠·단추 같은 6+ anatomy 필요.
- 패턴 (Flaticon Blue Duotone 레퍼런스 스타일 기준 — 가급적 ②·③·④를 우선):
  - ① **Single Center**: 객체 1개 중앙, 풍부한 anatomy. (단순 키워드에만 사용)
  - ② **Container-Inside**: 큰 *filled* 컨테이너(말풍선/뱃지/스크린/카드) + 내부 보조 심볼. 예: 폰 화면 안에 코드창, 노트북 위에 말풍선 + 자동차, 폰 옆에 자물쇠 뱃지+손가락.
  - ③ **Device-Stack**: 디바이스 본체(outline) + 부속 객체(filled badge) 옆에 배치. 객체 사이 ≥16 unit gap. 예: 폰 + 카메라 뱃지.
  - ④ **Network Scene-Tree**: 2~3개 객체 + connector 실선(stroke="currentColor")으로 연결. 예: 클라우드 + 폰 + 노트북 + 케이블, 클라우드 + 서버랙 + 디바이스.
- 어떤 패턴이든 *최소 2개 객체*를 권장 (Single Center는 키워드가 단일 사물일 때만).

## Creative Latitude
- KEYWORD을 *의미적으로 풍부하게* 해석하라. 단일 단어라도 *맥락의 핵심 디테일*을 함께 그린다.
- 레퍼런스 스타일 해석 예 (대부분 ②~④ 패턴 사용):
  - "Call / 통화" → **노트북(outline) + 말풍선(filled) 안에 수화기**
  - "Camera / 카메라" → **폰(outline) + 카메라 뱃지(filled) 옆 배치**
  - "Car / 자동차" → **노트북 + 말풍선 안에 차** (검색·표시 맥락 함의)
  - "Cloud Data / 클라우드 데이터" → **클라우드(outline) + 노트북·폰 + 연결선**
  - "Coding / 코딩" → **폰(outline) + 코드창(filled, </> 마커) 위에 레이어**
  - "Lock / 보안" → **폰(outline) + 자물쇠 뱃지(filled) + 손가락 anatomy**
  - "Server" → **클라우드 + 서버랙(filled LED 슬롯들) + 폰 + 연결선**
  - "Researcher / 연구원" → **인물(머리+가운+안경) + 비커·현미경 디테일** (Container-Inside: 말풍선 안에 인물 가능)
  - "Doctor / 의사" → **인물(머리+가운) + 청진기·차트** / "Developer / 개발자" → **인물(머리+안경) + 노트북·코드**
- 예시 좌표를 베끼지 말고 *구성 패턴*을 흡수해 새로 그려라.

## ⚠️ Subject Mandate — Persona / Role Keywords
KEYWORD이 *사람·직업·역할*이면 (예: 연구원, 연구자, 과학자, 의사, 간호사, 학생, 교사, 강사, 개발자, 엔지니어, 디자이너, 분석가, 전문가, 관리자, 농부, 어부, 기술자, 운영자, 사용자, 고객, 팀, 팀원):
- 주피사체는 **반드시 인물 anatomy** (머리 + 몸통 + 역할 표지 1+개). 도구·환경 단독 금지.
- 권장 비율 (512 canvas):
  - 머리: <circle> 또는 <ellipse>, r ≈ 36~56, 중심 y ≈ 160~200.
  - 몸통: 머리 아래 y ≈ 220~420, 폭은 머리 지름의 2~3배. path로 가운/상의 실루엣.
  - 역할 표지(필수 1+): 가운(어깨~몸통 path 내부 fill) / 안경(rect 2개+line) / 모자 / 손에 든 도구 / 가슴 배지 / 청진기 곡선.
- 도구·환경은 *보조*. 인물 옆에 두거나 Container-Inside(말풍선 안에 인물)·Scene-Tree(인물 + 도구 + connector)로 배치.
- "abstract"·"minimal" angle도 **최소 머리 + 어깨 실루엣**은 있어야 함. 얼굴 표정·돋보기·비커 단독으로 인물 대체 금지.
- ❌ 거절 사례 (실제 발생함): "연구원"인데 비커만, 현미경만, 돋보기에 얼굴만, 책상만, 클립보드만 — 사람이 빠지면 키워드 의미가 깨짐.
- ✅ 정답: 인물 anatomy 4~6개 + 역할 도구 1~2개 + (선택) 보조 객체.

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

## Anatomy Templates (객체별 디테일 체크리스트)
객체를 그릴 때 *최소 6개* 요소를 채운다. 모든 항목 강요는 아니지만, 절반 이상 채우지 않으면 silhouette처럼 비어 보임. (레퍼런스 cloud-data.png의 폰·노트북·클라우드가 각각 6~8 anatomy 수준.)

**Person / 인물** (persona 키워드 필수)
1. 머리 — <circle> 또는 <ellipse>, r 36~56
2. 눈 — 작은 fill circle 2개 (또는 점 path)
3. 안경/마스크 — rect 2개 + bridge line / 곡선 path
4. 머리카락 또는 캡 — 머리 상단 곡선 path
5. 목/어깨 라인 — 짧은 수평/곡선
6. 가운·상의 본체 — path 또는 filled rect
7. 옷깃 / V-넥 / 라펠 — 가운데 수직 line 또는 V path
8. 단추 — 작은 fill circle 2~3개 수직 정렬
9. 가슴 포켓 — 작은 rect (filled 가능)
10. 손/소매 — 옷 끝 cuff line (선택)

**Lab Coat / 가운** (인물의 6~9 중 일부)
- 옷깃 V + 라펠 path 2개 + 단추 3개 + 가슴 포켓 rect + 사이드 라인 + 소매 cuff

**Beaker / 비커 (Erlenmeyer)**
1. 본체 path (사다리꼴/플라스크 외곽)
2. 좁은 목 (수직 양 라인)
3. 입구 lip (짧은 수평)
4. 액체 surface line (수평 line, 내부)
5. 액체 fill (currentColor, lip 아래 path)
6. 눈금 tick 2~3개 (짧은 horizontal line)
7. 베이스 (선택, 받침 ellipse)

**Microscope / 현미경**
1. 베이스 rect/사다리꼴
2. 본체 arm 컬럼 (수직 path)
3. 접안렌즈 (상단 작은 rect 또는 ellipse)
4. 대물렌즈 회전체 (circle)
5. 스테이지 (수평 rect)
6. 표본 슬라이드 (작은 rect, 스테이지 위)
7. 포커스 노브 (작은 circle, 컬럼 측면)
8. 라이트 (선택, 베이스 위 작은 marker)

**Phone / 폰**
1. body rect (rx ≥ 24)
2. 상단 노치 (둥근 작은 rect 가운데 위)
3. 스피커 라인 (노치 옆 짧은 line)
4. 화면 rect (inner, filled surface 권장)
5. 하단 home bar (둥근 짧은 line)
6. 사이드 버튼 (1~2개 작은 rect, 외곽 옆)
7. 화면 내부 콘텐츠 — 작은 라인/도트 (선택)

**Laptop / 노트북**
1. 사다리꼴 base (양 옆 기울어진 path)
2. 베이스 상단 hinge line
3. 스크린 rect
4. 스크린 상단 노치 (작은 rect 가운데)
5. 스크린 surface (filled rect, 안쪽)
6. 키보드 라인 (선택, base 위 수평 라인)
7. 베이스 하단 indicator (짧은 line)

**Cloud / 클라우드**
1. 메인 큰 bump (큰 circle 또는 ellipse)
2. 좌측 작은 bump
3. 우측 작은 bump
4. 하단 평평한 line
5. 내부 marker (선택, 점 또는 화살표)
6. 케이블 connector (외부, line 또는 dashed)

**Speech Bubble / 말풍선**
1. 둥근 사각 (rx ≥ 16)
2. 삼각 꼬리 (path 아래로)
3. 내부 콘텐츠 객체 1개 (수화기·차·코드 등)
4. 콘텐츠 보조 디테일 (점 3개·라인·꺽쇠)

**Hand (Pointing)**
1. 손바닥 base (path)
2. 검지 (수직 path)
3. 검지 손톱 (선택, 작은 line)
4. 엄지 (작은 path)
5. 접힌 손가락 3개 (반원 라인 3개)
6. 손목 라인

**Speech / Status Accessory** (레퍼런스 액세서리)
- 코너 brackets 4개 (Camera 화면처럼)
- ellipsis 3 dots (수평 ··· marker)
- 십자 + 마커 (Camera 중앙)
- 스테이터스 dot (단일 fill marker)

## Marker Sizing
- 인디케이터 점·키홀·헤더 dot 등 *opaque marker*: r=4~7 max.
- 헤더 traffic dots: r=6, fill="currentColor", 동일 크기 3개.

## Output Rules
1. 루트는 정확히: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision">. width/height 두지 마라.
2. 색은 오직 "currentColor". hex/rgb/그라디언트 금지.
3. 내부 surface와 작은 marker 모두 fill="currentColor"로 명시. 둘 다 풀컬러로 렌더되며 면적별 자동 분기는 없다.
4. Connector 점선이 어울리면 stroke-dasharray="10 10".
5. 허용 요소: <path>, <circle>, <rect>, <line>, <polyline>, <polygon>, <ellipse>.
6. 금지: <defs>, <linearGradient>, <radialGradient>, <pattern>, <mask>, <clipPath>, <filter>, <use>, <image>, <script>, <style>, <foreignObject>, on*, inline style.
7. **도형 수 18~28 typical (32까지 허용, 36이 하드 캡).** 17 이하면 디테일 부족(레퍼런스 평균 22).
8. 모든 shape는 x=40..472, y=40..472 안.
9. 최상위는 { "items": [...] } 객체. raw array만 두는 것 금지, 코드펜스(\`\`\`json … \`\`\`) 금지, 어떠한 prose도 금지.
10. items.length === <COUNT>.

## Self-Check (모두 통과해야 출력)
1. 서로 다른 객체 body가 닿거나 겹치지 않는가?
2. 도형 수 18~28 사이? 각 객체 anatomy 6~10? (레퍼런스 수준의 디테일 — 5 이하면 silhouette)
3. *각 객체마다* fill="currentColor" 영역이 최소 1개 — 내부 surface, filled body, marker 중 어떤 형태든. outline-only로만 끝나는 객체는 없도록.
4. *본체 fill 선택이 의도된 것인가*: 디바이스/도구 외곽은 outline 권장, 말풍선·뱃지·강조 컨테이너만 filled body. 모든 본체가 filled = 답답, 모든 본체가 outline = 빈약.
5. 마커 dot/keyhole r=4~7?
6. 사방 40 unit margin 확보? 시각 무게중심이 (256,256)에서 ±64 안?
7. KEYWORD을 *창의적으로 디테일하게* 해석했는가?
8. **좌표 품질** — rect/line은 정수(4·8 배수) 정렬? 곡선 제어점 정수 또는 .5? 같은 직선 위 노드 3개 이상 없음? 베지에 핸들이 한 노드에서 좌우 대칭?
9. **곡선 품질** — 원·호는 circle/ellipse 또는 path A로? path C로 원 근사 안 했나?
10. **다중 사이즈 시뮬레이션** — 24px·48px·96px 멘탈 렌더 시 가장 작은 크기에서도 KEYWORD을 한눈에 식별 가능? 작은 마커가 다른 마커와 1px 안으로 겹치지 않음?
11. items 배열 길이가 정확히 <COUNT>인가? items[i].angle이 모두 다른 enum 값인가?
12. items[i].svg와 items[j].svg가 silhouette 단계에서 분명히 구분되는가?
13. **세트 일관성** — 모든 item의 총 fill 면적이 평균 ±30% 안? 객체당 anatomy 개수가 6~10 범위에서 골고루?
14. **디테일 밀도** — 각 객체의 Anatomy Template 체크리스트에서 최소 6개 채웠는가? 인물이면 머리·눈·안경·옷깃·단추·가운 6개 이상? 비커면 본체·목·lip·액체surface·액체fill·tick 6개 이상? 단순 silhouette(머리+몸 + V라인 1개)으로 끝낸 객체는 없는가?

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
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" shape-rendering=\\"geometricPrecision\\"><polyline points=\\"60,272 170,144 280,272\\"/><rect x=\\"80\\" y=\\"272\\" width=\\"180\\" height=\\"160\\"/><rect x=\\"100\\" y=\\"180\\" width=\\"28\\" height=\\"76\\"/><rect x=\\"106\\" y=\\"304\\" width=\\"48\\" height=\\"48\\" fill=\\"currentColor\\"/><rect x=\\"170\\" y=\\"336\\" width=\\"60\\" height=\\"96\\" fill=\\"currentColor\\"/><path d=\\"M 90 130 Q 170 56 250 130\\"/><path d=\\"M 114 152 Q 170 96 226 152\\"/><path d=\\"M 138 172 Q 170 140 202 172\\"/><circle cx=\\"170\\" cy=\\"184\\" r=\\"6\\" fill=\\"currentColor\\"/><rect x=\\"328\\" y=\\"184\\" width=\\"120\\" height=\\"240\\" rx=\\"20\\"/><rect x=\\"346\\" y=\\"216\\" width=\\"84\\" height=\\"172\\" fill=\\"currentColor\\"/><rect x=\\"356\\" y=\\"296\\" width=\\"64\\" height=\\"68\\" rx=\\"4\\" fill=\\"currentColor\\"/><path d=\\"M 366 296 V 276 a 22 22 0 0 1 44 0 V 296\\"/><circle cx=\\"388\\" cy=\\"328\\" r=\\"5\\" fill=\\"currentColor\\"/><line x1=\\"376\\" y1=\\"408\\" x2=\\"400\\" y2=\\"408\\"/><line x1=\\"260\\" y1=\\"208\\" x2=\\"328\\" y2=\\"264\\" stroke-dasharray=\\"10 10\\"/></svg>"
    },
    {
      "name": "Smart Home Security",
      "tags": ["smarthome", "security", "lock", "minimal"],
      "category": "iot",
      "angle": "minimal",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" shape-rendering=\\"geometricPrecision\\"><rect x=\\"176\\" y=\\"244\\" width=\\"160\\" height=\\"168\\" rx=\\"12\\" fill=\\"currentColor\\"/><path d=\\"M 200 244 V 196 a 56 56 0 0 1 112 0 V 244\\"/><circle cx=\\"256\\" cy=\\"312\\" r=\\"14\\" fill=\\"currentColor\\"/><line x1=\\"256\\" y1=\\"326\\" x2=\\"256\\" y2=\\"364\\"/></svg>"
    }
  ]
}

이 예시는 *원리*만 보여준다 — 너의 KEYWORD에 맞게 *완전히 새로운 구도*로 그려라. 좌표를 그대로 복사하지 마라.
` as const;

export function buildPrompt(keyword: string, description?: string, count: number = 3): string {
  const safeKeyword = keyword.trim().length > 0 ? keyword.trim() : '(키워드를 입력하세요)';
  const trimmed = description?.trim() ?? '';
  const descBlock = trimmed.length > 0 ? `DESCRIPTION: ${trimmed}\n` : '';
  const rawCount = Number.isFinite(count) ? Math.floor(count) : 3;
  const safeCount = Math.max(4, Math.min(8, rawCount));
  return PROMPT_GUIDE_TEMPLATE.replace('<KEYWORD>', safeKeyword)
    .replace('<DESC_BLOCK>', descBlock)
    .replaceAll('<COUNT>', String(safeCount));
}
