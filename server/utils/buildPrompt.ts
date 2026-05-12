import { darken, normHex, pickBackground } from '../../utils/color';

export type BuildPromptInput = {
  keyword: string;
  baseHex: string;
  description?: string;
  name?: string;
  category?: string;
  tags?: string[];
};

export type BuildPromptResult = {
  prompt: string;
  backgroundHex: '#FFFFFF' | '#000000';
};

const TEMPLATE = `Create a flat, minimalist duotone icon of {keyword}.

Output
- 512×512 px PNG
- Background: solid pure {background_hex}, completely flat — no gradient, no shadow, no texture, no checkered pattern
- The {background_hex} background will be programmatically removed in post-processing. Do NOT attempt to render transparency, alpha edges, or soft fades — simply paint solid {background_hex} wherever the icon is absent
- Use only two distinct colors for the icon itself (no gradients, no shadows, no glows beyond standard edge anti-aliasing)
- Sharp, clean edges between color regions

Composition
- Single centered subject with generous padding
- Geometric, simplified silhouette
- Clear visual separation between outline strokes and filled regions
- No text, no 3D effects, no photorealism, no unrelated extra objects

Stroke (outline)
- Color: {stroke_hex}   (each RGB channel of {base_hex} multiplied by 0.6, rounded to integer)
- Thick, uniform width (about 24px on a 512px canvas)
- Rounded line caps and joins
- Clean closed shapes

Fill (inner colored regions)
- Color: {base_hex}
- Solid flat color, no gradient or variation
- Applied selectively to inner shapes for visual emphasis
- Remaining interior regions of the icon stay solid {background_hex}, identical to the background

Concept
- name: {name}
- category: {category}
- tags: {tags}
- description: {description}`;

export function buildPrompt(input: BuildPromptInput): BuildPromptResult {
  const base = normHex(input.baseHex);
  const stroke = darken(base, 0.4);
  const background = pickBackground(base);
  const keyword = input.keyword.trim();
  const name = (input.name ?? '').trim() || keyword;
  const category = (input.category ?? '').trim() || '(unspecified)';
  const tagsJoined = (input.tags ?? []).join(', ') || '(none)';
  const description = (input.description ?? '').trim() || '(none)';

  const prompt = TEMPLATE
    .replace('{keyword}', keyword)
    .replace('{stroke_hex}', stroke)
    .replace(/\{base_hex\}/g, base)
    .replace(/\{background_hex\}/g, background)
    .replace('{name}', name)
    .replace('{category}', category)
    .replace('{tags}', tagsJoined)
    .replace('{description}', description);

  return { prompt, backgroundHex: background };
}
