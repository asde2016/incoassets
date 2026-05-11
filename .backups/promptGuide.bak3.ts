export const PROMPT_GUIDE_TEMPLATE =
  `You are an icon designer. Output ONLY one JSON object with an "items" array of exactly <COUNT> items. No prose, no code fences.

KEYWORD: <KEYWORD>
<DESC_BLOCK>
# Style — Duotone (Flaticon Blue style)
- viewBox 0 0 512 512, safe area 40..472.
- Single stroke-width 12, stroke="currentColor", stroke-linecap/linejoin="round".
- Two tones from ONE color:
  - Lines = stroke="currentColor"  → solid dark
  - Fills = fill="currentColor" fill-opacity="0.35"  → soft tint
- Every object needs ≥1 fill region. Pure outline = looks empty.
- Shapes per icon: 10~18. Anatomy parts per object: 4~7.
- Optical center near (256,256), no overlap between distinct objects.
- **Fill the safe area.** Content bounding box must reach within ~16 unit of EACH safe-area edge — i.e. min-x ≤ 56, max-x ≥ 456, min-y ≤ 56, max-y ≥ 456 (span ≥ 400 on each axis). Bunching content in a 200×200 center patch is rejected — looks like a miniature.

# Composition (pick variety across the <COUNT> items)
- Container-inside: filled bubble/badge holds a smaller symbol inside a device screen.
- Device-stack: 2 objects side-by-side, ≥16 unit gap.
- Scene-tree: 2~3 objects + connector lines (stroke-dasharray="10 10" optional).
- Single-center: only for atomic keywords.

# Persona keywords (e.g. 연구원, 개발자, 의사)
The primary subject MUST be a person: head circle + shoulders/coat + ≥1 role marker (glasses / lab coat lapel / stethoscope / tool in hand). Tools alone don't satisfy the keyword.

# Variation across <COUNT> items
Each item picks a DIFFERENT angle from:
["standard","with-action","minimal","composed","in-context","abstract","scene","with-detail"]
No two items share an angle or composition pattern.
Across the <COUNT> items, use DIFFERENT primary symbols. Don't reuse the same atom (star, medal, trophy, document) in 3+ items. Each variant must read as a different visual idea.

# Abstract concept keywords
When KEYWORD is an abstract concept (성과/결과/outcome, 혁신/innovation, 협력/collaboration, 안전/security, 효율/efficiency, etc.), each variant uses a DIFFERENT visual idiom from the keyword's vocabulary:
- 연구 성과 / Research Outcome → trophy / journal-paper / certificate-ribbon / chart-dashboard / medal / patent-badge / award-with-citation
- 혁신 / Innovation → lightbulb+gear / blueprint / spark+arrow-up / lab beaker / circuit-brain
- 협력 / Collaboration → handshake / chat bubbles between figures / overlapping circles / network nodes
- 안전 / Security → lock / shield / hand+shield / vault / fingerprint
- 효율 / Efficiency → stopwatch / arrow-up + bar chart / gear loop / lightning bolt
Pick a different idiom per variant. Resolving all variants to the same atom (e.g. star on different things) is rejected.

# Curve quality
- Circles → <circle>/<ellipse>, not C-bezier approximations.
- Arcs → path "A" command.
- Axis-aligned coords: integers, multiples of 4.
- No 3 collinear points in one path.

# Output rules
1. Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
2. Allowed nodes: path, circle, rect, line, polyline, polygon, ellipse.
3. Forbidden: defs, gradient, mask, filter, use, image, script, style, on*, inline style, hex/rgb colors.
4. Allowed color values: "currentColor" and "none" only. fill-opacity 0.2~0.5 only on fill="currentColor".

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
