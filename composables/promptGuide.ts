export const PROMPT_GUIDE_TEMPLATE =
  `Create a flat, minimalist duotone icon of {keyword}, in the style of classic flat icon libraries (Flaticon / Iconfinder / Generic duotone icons) — but with deliberately THIN outlines for post-processing compatibility.

Style
- Classic flat duotone:
  (1) Thin uniform line outlines that form the entire icon structure
  (2) Solid color fills inside outlined regions — fills can be substantial (covering large areas like an entire card body, hand, or device body), not limited to small accents
- CRITICAL: every filled region MUST be enclosed by a line stroke outline of the same outline color. Fills are NEVER drawn as standalone solid shapes without an outline. The outline wraps around every filled region exactly the same way it wraps around the main structure.
- Two-tone aesthetic with strong contrast: black outline + blue fill

Output
- 1024×1024 px PNG
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
- Stroke width: 8-12px on the 1024×1024 canvas (HARD CAP: never thicker than 16px)
- Reference style: thin uniform strokes like Lucide / Heroicons / Tabler outline icon sets — never bold
- Critical: source stroke thickness will be re-rendered in post-processing (server thins strokes to a fixed target); keep it deliberately thin and crisp
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

// Bilingual / BilingualTags 는 types/icon.ts 의 Zod 기반 canonical 정의를
// Nuxt auto-import 로 그대로 사용한다. 여기서는 재선언하지 않음.

export type PromptInput = {
  keyword: string;
  description?: string;
};

export function buildPrompt(input: PromptInput): string {
  const safeKeyword =
    input.keyword.trim().length > 0 ? input.keyword.trim() : '(키워드를 입력하세요)';
  // keyword 가 프롬프트 도입부에 first-class 로 박히고, description 만 추가 컨텍스트로 사용.
  // name/category/tags 는 더 이상 프롬프트에 주입하지 않음 — Concept 블록이 abstract 키워드
  // ("API" → 통신/개발/인터페이스 ...) 에서 산만한 신호를 만들어 결과 품질을 떨어뜨렸음.
  const context = input.description?.trim() ?? '';
  return PROMPT_GUIDE_TEMPLATE
    .replace('{keyword}', safeKeyword)
    .replace('{context}', context);
}
