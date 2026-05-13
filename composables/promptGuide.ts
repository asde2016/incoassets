export const PROMPT_GUIDE_TEMPLATE =
  `Create a flat, minimalist duotone icon of {keyword}, in the style of classic flat icon libraries (Flaticon / Iconfinder / Generic duotone icons) — but with deliberately THIN outlines for post-processing compatibility.

Style
- Classic flat duotone:
  (1) Thin uniform line outlines that form the entire icon structure
  (2) Solid color fills inside outlined regions — fills can be substantial (covering large areas like an entire card body, hand, or device body), not limited to small accents
- CRITICAL: every filled region MUST be enclosed by a line stroke outline of the same outline color. Fills are NEVER drawn as standalone solid shapes without an outline. The outline wraps around every filled region exactly the same way it wraps around the main structure.
- Two-tone aesthetic with strong contrast: black outline + blue fill

Output
- 512×512 px PNG
- Background: solid pure #FFFFFF, completely flat — no gradient, shadow, texture, or checkered pattern
- The #FFFFFF background will be programmatically removed in post-processing. Do NOT render transparency, alpha edges, or soft fades — paint solid #FFFFFF wherever the icon is absent
- Use only two distinct colors throughout the icon
- Sharp, clean edges between color regions

Composition
- Single centered subject with generous padding
- Geometric, simplified silhouette — flat icon library aesthetic with refined detail quality
- Fills applied generously and decisively. The designer chooses per region whether to fill or leave outlined-only, based on visual hierarchy. Typical patterns:
  - Main objects (cards, hands, currency, devices, buildings) — often filled with base color
  - Internal details (stripes, dashes, dots, frames within frames) — may be outlined-only with white interior
  - Accent areas (wristbands, magnetic stripes, button highlights, column shafts) — filled
- Organic forms (hands, fingers, faces) drawn with smooth confident curves and recognizable anatomy
- Geometric forms (cards, devices, frames) drawn with precise corners and consistent corner radii
- No text, no 3D effects, no photorealism, no gradients, no extra unrelated objects

Line strokes
- Color: #000000 (pure black)
- Used for: (a) the entire icon outline, AND (b) the outline of every filled region without exception
- Thin uniform width — approximately 6px on the 512×512 canvas (about 1.2% of canvas width)
- Consistent thin width across the entire icon — do NOT draw bold or thick strokes. The classic icon library look is preserved through fill composition, not through stroke thickness
- Critical: source stroke thickness will be re-rendered in post-processing; keep it deliberately thin and crisp
- Rounded line caps and joins
- Smooth curves on organic forms, precise straight edges on geometric forms

Fills
- Color: #2E5BFF (pure blue)
- Solid flat color, no gradient or variation
- Applied to entire enclosed regions where it strengthens visual hierarchy — can cover substantial areas (full card body, full hand, full column, etc.)
- Every filled region is enclosed by a #000000 line stroke outline of the same thin width as the rest of the icon
- Unfilled regions inside outlines stay solid #FFFFFF, identical to the background

{context}
` as const;

export type Bilingual = { ko: string; en: string };
export type BilingualTags = { ko: string[]; en: string[] };

export type PromptInput = {
  keyword: string;
  description?: string;
  name?: Bilingual;
  category?: Bilingual;
  tags?: BilingualTags;
};

function pairLabel(ko: string, en: string): string {
  if (ko && en) return `${ko} (${en})`;
  return ko || en;
}

function cleanList(arr: string[] | undefined): string[] {
  return (arr ?? [])
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length > 0);
}

function buildContext(input: PromptInput): string {
  const nameKo = input.name?.ko?.trim() ?? '';
  const nameEn = input.name?.en?.trim() ?? '';
  const catKo = input.category?.ko?.trim() ?? '';
  const catEn = input.category?.en?.trim() ?? '';
  const tagsKo = cleanList(input.tags?.ko);
  const tagsEn = cleanList(input.tags?.en);

  const conceptLines: string[] = [];
  if (nameKo || nameEn) conceptLines.push(`- name: ${pairLabel(nameKo, nameEn)}`);
  if (catKo || catEn) conceptLines.push(`- category: ${pairLabel(catKo, catEn)}`);
  // tags 는 ko + en 합쳐 단일 줄 — LLM 이 한쪽 어휘만 알고 있어도 매칭되도록 풍부하게.
  if (tagsKo.length > 0 || tagsEn.length > 0) {
    conceptLines.push(`- tags: ${[...tagsKo, ...tagsEn].join(', ')}`);
  }

  const concept = conceptLines.length > 0 ? `Concept\n${conceptLines.join('\n')}` : '';
  const description = input.description?.trim() ?? '';

  return [concept, description].filter((s) => s.length > 0).join('\n\n');
}

export function buildPrompt(input: PromptInput): string {
  const safeKeyword =
    input.keyword.trim().length > 0 ? input.keyword.trim() : '(키워드를 입력하세요)';
  const context = buildContext(input);
  return PROMPT_GUIDE_TEMPLATE
    .replace('{keyword}', safeKeyword)
    .replace('{context}', context);
}
