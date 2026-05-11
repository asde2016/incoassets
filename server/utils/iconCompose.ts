/**
 * Direct-LLM icon generation.
 *
 * We hand Ollama a tightly-scoped prompt + a concrete reference example and
 * ask it to emit a complete duotone SVG made of primitives only (no paths,
 * no organic curves, no figurative anatomy). The library-composition path
 * (collectCandidates / assembleSvg) is intentionally retired — local 9B models
 * can't place pre-drawn icons coherently, but they CAN draw geometric
 * dashboard-style scenes when given a clear template.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000;

/**
 * One concrete reference scene baked into the prompt. The model copies its
 * tone, density and proportions; the keyword/scene-hint redirects content.
 */
const REFERENCE_DASHBOARD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" ' +
  'stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="40" y="80" width="432" height="352" rx="24"/>' +
  '<circle cx="80" cy="115" r="6" fill="currentColor"/>' +
  '<circle cx="116" cy="115" r="6" fill="currentColor"/>' +
  '<circle cx="152" cy="115" r="6" fill="currentColor"/>' +
  '<rect x="200" y="100" width="240" height="32" rx="6" fill="currentColor"/>' +
  '<line x1="40" y1="150" x2="472" y2="150"/>' +
  '<line x1="144" y1="150" x2="144" y2="432"/>' +
  '<line x1="72" y1="190" x2="128" y2="190"/>' +
  '<line x1="72" y1="226" x2="128" y2="226"/>' +
  '<line x1="72" y1="262" x2="128" y2="262"/>' +
  '<rect x="180" y="190" width="120" height="80" rx="6" fill="currentColor"/>' +
  '<rect x="320" y="190" width="120" height="80" rx="6" fill="currentColor"/>' +
  '<rect x="180" y="296" width="100" height="40" rx="6"/>' +
  '<polygon points="360,330 360,394 380,378 392,402 404,396 392,374 416,370" fill="currentColor"/>' +
  '</svg>';

const SCENE_HINTS = [
  'window/dashboard — outer rect rx 20~24 with 3 traffic dots top-left, a filled URL/title rect top-right, chrome divider line, sidebar divider + 2~3 menu lines, 2~3 filled content cards, 1 outline action button, optional cursor or chart polygon',
  'device-stack — two device-like outlines side-by-side (≥16 unit gap); each has one filled inner screen panel and 2~3 detail lines beneath',
  'network-scene — a 3-bump cloud near the top (3 circles + bottom flat line), connected by 1~2 lines (some dashed via stroke-dasharray="10 10") to 2 device rects below',
  'container-inside — one large outlined container (or speech-bubble-like rounded rect with a triangular tail line) holding a smaller filled cluster of rects/lines inside',
  'card-grid — a 2x2 grid of filled cards, each with a short outline title line on top, and a horizontal action bar of small rects/circles at the bottom',
  'phone-mock — a tall rounded outer rect (rx 24~32) with a small notch rect at the top, a large filled inner screen rect, a small home-bar line at the bottom, and a side button',
];

export type GenerateResult = {
  svg: string;
  meta: { sceneHint: string; rawSnippet: string };
};

type OllamaResponse = {
  response?: string;
  thinking?: string;
  done_reason?: string;
};

async function ollamaCall(prompt: string, jsonMode: boolean): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      // think:false disables Qwen-3.5/DeepSeek-R1-style reasoning that dumps
      // chain-of-thought into the separate `thinking` field and leaves the
      // `response` empty when combined with format:json.
      think: false,
      options: { temperature: 0.6 },
    };
    if (jsonMode) body.format = 'json';
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const j = (await res.json()) as OllamaResponse;
    if (!j.response) {
      // eslint-disable-next-line no-console
      console.warn(
        '[iconGenerate] empty response (jsonMode=%s, done_reason=%s, thinking_len=%d)',
        jsonMode,
        j.done_reason,
        j.thinking?.length ?? 0,
      );
      if (j.thinking) {
        const m = j.thinking.match(/\{[\s\S]*\}/);
        if (m) return m[0];
      }
    }
    return typeof j.response === 'string' ? j.response : '';
  } finally {
    clearTimeout(timer);
  }
}

async function ollama(prompt: string): Promise<string> {
  let raw = await ollamaCall(prompt, true);
  if (!raw.trim()) {
    // eslint-disable-next-line no-console
    console.warn('[iconGenerate] retrying without format:json …');
    raw = await ollamaCall(prompt, false);
  }
  return raw;
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* try regex extraction */
  }
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

function extractInlineSvg(raw: string): string | null {
  // If Ollama dropped the JSON wrapper and just emitted a raw SVG, salvage it.
  const m = raw.match(/<svg[\s\S]*<\/svg>/i);
  return m ? m[0] : null;
}

function buildPrompt(keyword: string, description: string, sceneHint: string): string {
  return `You design a single duotone vector icon in the Flaticon Blue Duotone style.

KEYWORD: ${keyword}
DESCRIPTION: ${description || '(none)'}
SCENE PATTERN: ${sceneHint}

# Style (mandatory)
- Root must be exactly: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
- Two tones come from ONE color rendered externally: stroke renders as a darker tone, fill="currentColor" renders as the medium tone. You only need to use currentColor and none.
- Use fill="currentColor" on interior content panels, badges, and small markers (dots/buttons). Leave outer device/container outlines unfilled (default fill="none").
- NEVER use fill-opacity, stroke-opacity, opacity, or any inline style. NEVER hardcode hex/rgb colors.

# Allowed primitives ONLY (NO <path>, NO <g>, NO <defs>/<gradient>/<mask>/<filter>/<script>)
- <rect x y width height rx>
- <circle cx cy r>
- <line x1 y1 x2 y2>
- <polyline points>
- <polygon points>
- <ellipse cx cy rx ry>

# Composition rules
- Safe area x=40..472, y=40..472. Fill it: the content bounding box should reach within ~32 units of every safe-area edge (min(x) ≤ 72, max(x+width) ≥ 440, same for y).
- 12 to 22 primitive shapes total — each must be semantically meaningful (no decorative noise).
- Integer coordinates, multiples of 4 preferred. Use rounded corners (rx 4~24) for nearly all rects so the icon reads as friendly.
- NO people, faces, hands, body anatomy, or organic curves. Keep everything geometric and architectural (windows, panels, devices, cards, charts, grids, badges, arrows, dots).

# Reference example (KEYWORD "Dashboard") — match this tone, density, and proportions:
${REFERENCE_DASHBOARD_SVG}

# Output (JSON ONLY — no prose, no code fences)
{
  "svg": "<svg ...>...</svg>"
}

Rules for the output JSON:
- Single object with exactly one key "svg".
- The SVG string must include the closing </svg>.
- Output ONLY the JSON object, nothing else.`;
}

export async function generateMany(
  keyword: string,
  description: string,
  count: number,
): Promise<GenerateResult[]> {
  return Array.from({ length: count }).reduce<Promise<GenerateResult[]>>(
    async (accP, _unused, i) => {
      const acc = await accP;
      const sceneHint = SCENE_HINTS[i % SCENE_HINTS.length] ?? SCENE_HINTS[0]!;
      const prompt = buildPrompt(keyword, description, sceneHint);
      const raw = await ollama(prompt);
      // eslint-disable-next-line no-console
      console.log(
        '[iconGenerate] variant %d hint="%s…" raw_len=%d',
        i,
        sceneHint.slice(0, 40),
        raw.length,
      );
      const parsed = safeParseJson<{ svg?: string }>(raw);
      let svg = typeof parsed?.svg === 'string' ? parsed.svg : '';
      if (!svg) {
        const salvaged = extractInlineSvg(raw);
        if (salvaged) svg = salvaged;
      }
      acc.push({ svg, meta: { sceneHint, rawSnippet: raw.slice(0, 200) } });
      return acc;
    },
    Promise.resolve<GenerateResult[]>([]),
  );
}
