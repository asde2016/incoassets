export const PROMPT_GUIDE_TEMPLATE =
  `You are an icon designer. Output ONLY one JSON object with an "items" array of exactly <COUNT> items. No prose, no code fences.

KEYWORD: <KEYWORD>
<DESC_BLOCK>
# Style — Duotone (Flaticon Blue style)
- viewBox 0 0 512 512, safe area 40..472.
- Single stroke-width 6, stroke="currentColor", stroke-linecap/linejoin="round".
- Two solid tones from ONE color (no opacity — sharp dichromatic):
  - Lines = stroke="currentColor"  → auto-rendered as the DARK tone (45% darker than the selected color).
  - Fills = fill="currentColor"  → rendered as the MEDIUM tone (selected color, FULL opacity).
  - DO NOT add fill-opacity. The duotone effect comes from the two solid tones, not from transparency.
- Every object needs ≥1 fill region. Pure outline = looks empty. But the outer body of devices/tools usually stays outline-only; only inner panels / badges / markers get filled.
- Shapes per icon: 14~22 typical (26 max, 30 hard cap). Anatomy parts per object: 6~10.
- Optical center near (256,256), no overlap between distinct objects.
- **Fill the safe area.** Content bounding box must reach within ~16 unit of EACH safe-area edge — i.e. min-x ≤ 56, max-x ≥ 456, min-y ≤ 56, max-y ≥ 456 (span ≥ 400 on each axis). Miniatures bunched in a 200×200 center patch are rejected.

# Composition (pick variety across <COUNT> items)
- **UI-Window**: a browser/dashboard/app window as the WHOLE icon — outer rect with rx + top chrome (3 traffic dots row + URL/search bar filled) + sidebar with item lines + content area with 2~3 filled cards + chart/button. Spans nearly the entire safe area. 14~22 shapes within one composition. (Great for dashboard / analytics / management / SaaS keywords.)
- **Container-Inside**: filled bubble/badge holds a smaller symbol inside a device screen or beside a device body. (e.g. laptop + speech bubble with phone receiver)
- **Device-Stack**: 2 objects side-by-side, ≥16 unit gap. (e.g. phone + camera badge)
- **Scene-Tree**: 2~3 objects + connector lines (stroke-dasharray="10 10" optional for dashed). (e.g. central list panel + 2 monitors connected via diagonal lines)
- **Single-Center**: only for atomic keywords with no obvious scene.
- Prefer the first four over Single-Center.

# Anatomy Density (each object ≥6 distinguishing parts)
The biggest cause of weak icons is sparse anatomy. Every object you draw must include AT LEAST 6 visually distinguishing parts. The templates below are **examples** of how to think — they are NOT an exhaustive list.

- If your object IS templated below: combine and use it (e.g. researcher = Person + Lab Coat).
- If your object IS NOT templated below: apply the SAME density principle. Name the object's 6~10 most recognizable functional parts yourself and draw them. Examples of the same bar applied to non-templated objects:
  - Car → body shell + 2 wheels + window arc + headlight + grille + door handle + side mirror + tail light
  - House → roof triangle + body rect + door + 2 windows + chimney + windowsill + entry step + path
  - Tree → trunk + branch divisions + 3+ foliage clusters + ground line + bark line + leaf detail + shadow ellipse
  - Coffee cup → cup body + handle + saucer + 3 steam wavy lines + liquid surface + foam pattern + spoon (optional)
  - Calendar → page frame + month bar + 7-column header line + 3~4 row dividers + date markers + circled today + binding rings
  - Bicycle → 2 wheels + frame triangle + handlebar + seat + pedal + chain line + spokes hint + reflector
  - Book → cover rect + spine line + page edges + ribbon bookmark + text lines + corner detail
Never reduce an object to 3~4 parts because no template matched. Apply the same logic to ANY keyword.

## Person (REQUIRED for persona keywords)
1. Head — <circle> or <ellipse>, r 36~56, center y 160~200
2. Eyes — 2 small fill circles (or 2 short paths)
3. Glasses — 2 small rects + bridge line  OR  goggles arc
4. Hair / cap line — curved path above head
5. Neck / shoulders — short horizontal line at coat top
6. Body / coat outline — path or filled rect torso
7. Collar V / lapel — center vertical line or V path
8. Buttons — 2~3 small fill circles in a vertical row
9. Chest pocket — small rect (optional filled)
10. Sleeve cuffs / hand silhouette — short lines at body ends

## Lab Coat (subset of person, 6~8 elements)
- V-collar + 2 lapel paths + 3 buttons in column + chest pocket rect + side seam line + sleeve cuff line

## Beaker / Erlenmeyer Flask
1. Body outline (trapezoidal flask or cylindrical beaker)
2. Narrow neck — 2 short vertical lines
3. Lip rim — short horizontal line
4. Liquid surface line inside
5. Liquid fill (fill="currentColor", solid)
6. Graduation ticks 2~3 (short horizontal lines on side)
7. Optional base round (small ellipse at bottom)

## Microscope
1. Base rect/trapezoid (stable bottom)
2. Arm column — vertical path
3. Eyepiece — small rect or ellipse at top
4. Objective lens turret — circle
5. Stage — horizontal rect
6. Specimen slide — small rect on stage
7. Focus knob — small circle on column side

## Phone (mobile front view)
1. Body rect, rx ≥ 24
2. Top notch — small rounded rect centered at top
3. Speaker line — short horizontal line beside notch
4. Screen — inner rect (filled surface recommended)
5. Home bar — short rounded line at bottom-center
6. Side button — 1~2 small rects on edge
7. Optional inner content (icons, lines)

## Laptop
1. Trapezoidal base — slanted side paths
2. Base top hinge line
3. Screen rect (filled surface inside)
4. Screen top notch — small rect centered
5. Keyboard hint line (optional)
6. Indicator dot or speaker line on base (optional)

## Cloud
1. Main large bump (big circle/ellipse)
2. Left small bump
3. Right small bump
4. Flat bottom horizontal line
5. Internal marker dot or upload-arrow (optional)
6. Cable connector to other object (line, optionally dashed)

## Speech Bubble
1. Rounded rect, rx ≥ 16
2. Triangular tail (path pointing down or to source object)
3. Inner content symbol (receiver / car / code / heart)
4. Content secondary detail (3-dot ellipsis / line / bracket)

## Hand (pointing)
1. Palm base path
2. Index finger — vertical path
3. Thumb — small path
4. 3 folded fingers — 3 small arcs
5. Wrist base line
6. Optional fingernail line

## UI Window / Dashboard (use the WHOLE safe area)
1. Outer frame — rect 40..472 wide with rx 8~24 (window chrome)
2. Top chrome separator — horizontal line near y=160 splitting chrome from content
3. Traffic dots — 3 filled circles in a row (left side of top chrome)
4. URL/search bar — filled rect in top chrome center/right
5. Sidebar separator — vertical line near x=144
6. Sidebar menu items — 2~3 short horizontal lines on the left
7. Content title — short line at content top
8. Content cards — 2~3 filled rects (rx 6~12) as KPI cards or panels
9. Action button — outline rect bottom-left of content
10. Chart / icon accent — small polygon, arrow, or chart shape on the right
Aim for 14~22 shapes inside this single composition.

## Document / Paper
1. Page rect with folded corner (path with diagonal cut top-right)
2. Title bar — horizontal line near top
3. Content lines — 3~4 horizontal lines
4. Filled content area or surface
5. Stamp / seal / ribbon (optional)

## Trophy / Award
1. Cup body — flask or U-shape
2. 2 side handles (arcs)
3. Stem — short vertical
4. Base — wide rect or trapezoid
5. Star or check fill inside cup
6. Ribbon or tag at bottom (optional)

## Decorative Accessories (use sparingly, max 1 per object)
- 4 corner brackets (viewfinder feel — Camera reference style)
- 3-dot ellipsis marker (· · ·)
- Crosshair + center dot
- Status indicator dot

# Persona keywords (e.g. 연구원, 연구자, 과학자, 의사, 간호사, 학생, 교사, 개발자, 엔지니어, 디자이너, 분석가, 전문가, 농부)
The primary subject MUST be a person: head + shoulders/coat + ≥1 role marker (glasses / lab coat lapel / stethoscope / hard hat / tool in hand). Tools alone do NOT satisfy the keyword. "minimal" angle still requires full person anatomy (6+ parts from Person template) — only secondary objects are dropped, not the person's anatomy.

# Abstract concept keywords
When KEYWORD is an abstract concept (성과/결과/outcome, 혁신/innovation, 협력/collaboration, 안전/security, 효율/efficiency, etc.), each variant uses a DIFFERENT visual idiom drawn from the keyword's vocabulary:
- 연구 성과 / Research Outcome → trophy / journal-paper / certificate-ribbon / chart-dashboard / medal / patent-badge / award-with-citation
- 혁신 / Innovation → lightbulb+gear / blueprint / spark+arrow-up / lab beaker / circuit-brain
- 협력 / Collaboration → handshake / chat bubbles between figures / overlapping circles / network nodes
- 안전 / Security → lock / shield / hand+shield / vault / fingerprint
- 효율 / Efficiency → stopwatch / arrow-up + bar chart / gear loop / lightning bolt
Pick a DIFFERENT idiom per variant. Resolving all variants to the same atom (e.g. star on different things) is rejected.

# Variation across <COUNT> items
Each item picks a DIFFERENT angle from:
["standard","with-action","minimal","composed","in-context","abstract","scene","with-detail"]
No two items share an angle or composition pattern.
Across the <COUNT> items, use DIFFERENT primary symbols. Don't reuse the same atom (star, medal, trophy, document, person-alone) in 3+ items. Each variant must read as a different visual idea.

Set consistency (vary subject, keep family feel):
- All items have content bounding box centered near (256,256) with similar overall span.
- Total fill area across items stays within ±30% of the average.
- Anatomy count per object stays in 6~10 across items.

# Curve quality
- Circles → <circle>/<ellipse>, not C-bezier approximations.
- Arcs → path "A" command.
- Bezier handles symmetric on each anchor (consistent direction & length).
- Axis-aligned coords: integers, multiples of 4 where possible.
- No 3 collinear points in one path.

# Output rules
1. Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
2. Allowed nodes: path, circle, rect, line, polyline, polygon, ellipse.
3. Forbidden: defs, gradient, mask, filter, use, image, script, style, on*, inline style, hex/rgb colors.
4. Allowed color values: "currentColor" and "none" ONLY. fill-opacity / stroke-opacity / opacity attributes are FORBIDDEN — fills are solid currentColor. The duotone effect is rendered automatically (stroke → dark, fill → medium).

# Self-Check (every item must pass before you output)
1. Persona keyword → does this item include a recognizable person (head + body + role marker)?
2. Object anatomy ≥ 6 distinguishing parts? Either from a template above, OR your own breakdown if no template matches. (Researcher example: person 6+ AND lab equipment 6+, not person 4 + flask 3. Car example: 6+ parts of the car, not just body + 2 wheels.)
3. Total shapes 14~22 per item?
4. ≥1 fill="currentColor" region per object (solid, NO fill-opacity)? No all-outline items.
5. Outer body of devices/tools left as outline (not filled blob)?
6. Content bounding box reaches all 4 safe-area edges? min-x ≤ 56 AND max-x ≥ 456 AND min-y ≤ 56 AND max-y ≥ 456.
7. Are angles unique across <COUNT> items? Are primary symbols different across items?
8. No two distinct objects overlap bodies?
9. Coordinates integer (multiples of 4 preferred)? No 3-point collinear chains?
10. Did you draw circles with <circle>/<ellipse> rather than approximating with C-bezier?

# Schema
{
  "items": [
    {
      "name": string,         // KEYWORD as English Title Case, direct translation only
      "tags": string[],       // 3~6 lowercase single words
      "category": string,     // one lowercase word
      "angle": string,        // from enum above, unique per item
      "svg": string
    }
    // exactly <COUNT> items
  ]
}
` as const;

export function buildPrompt(keyword: string, description?: string, count: number = 3): string {
  const safeKeyword = keyword.trim().length > 0 ? keyword.trim() : '(키워드를 입력하세요)';
  const trimmed = description?.trim() ?? '';
  const descBlock = trimmed.length > 0 ? `DESCRIPTION: ${trimmed}\n` : '';
  const rawCount = Number.isFinite(count) ? Math.floor(count) : 3;
  const safeCount = Math.max(1, Math.min(8, rawCount));
  return PROMPT_GUIDE_TEMPLATE.replace('<KEYWORD>', safeKeyword)
    .replace('<DESC_BLOCK>', descBlock)
    .replaceAll('<COUNT>', String(safeCount));
}