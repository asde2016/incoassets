import { searchIcons } from './iconIndex';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60_000;

// The compose pipeline targets a 512x512 outer viewBox with this nominal stroke
// width. Each <g transform="scale(N)"> wrapping a library icon pre-divides its
// stroke-width by N so the displayed stroke stays uniform across icons of
// different scales. (The customize transform later rewrites root stroke-width;
// future work can scale group stroke-widths accordingly.)
const COMPOSE_NOMINAL_STROKE = 6;

export type Candidate = {
  id: string; // "tabler:phone"
  set: string;
  name: string;
  body: string; // raw inner SVG, no per-path stroke-width
};

type IconItem = {
  kind: 'icon';
  icon: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
};
type LineItem = {
  kind: 'primitive';
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
};
type CircleItem = {
  kind: 'primitive';
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill?: boolean;
};
type RectItem = {
  kind: 'primitive';
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  fill?: boolean;
};
export type PlanItem = IconItem | LineItem | CircleItem | RectItem;
export type Plan = { items: PlanItem[] };

export type GenerateResult = {
  svg: string;
  meta: {
    tokens: string[];
    candidates: string[];
    plan: Plan;
    variantHint: string;
  };
};

async function ollamaCall(
  prompt: string,
  temperature: number,
  jsonMode: boolean,
): Promise<string> {
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
      options: { temperature },
    };
    if (jsonMode) body.format = 'json';
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const j = (await res.json()) as {
      response?: string;
      thinking?: string;
      done_reason?: string;
    };
    if (!j.response) {
      // eslint-disable-next-line no-console
      console.warn(
        '[iconCompose] ollama empty response (jsonMode=%s, done_reason=%s, thinking_len=%d)',
        jsonMode,
        j.done_reason,
        j.thinking?.length ?? 0,
      );
      // As a last resort, look for a JSON object embedded in the thinking field.
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

async function ollama(prompt: string, temperature: number): Promise<string> {
  // Try strict JSON mode first; if the model returns empty (some models stall
  // when their tokenizer/JSON grammar mismatch), fall back to plain text and
  // rely on safeParseJson to extract a JSON object from the prose.
  let raw = await ollamaCall(prompt, temperature, true);
  if (!raw.trim()) {
    // eslint-disable-next-line no-console
    console.warn('[iconCompose] retrying without format:json …');
    raw = await ollamaCall(prompt, temperature, false);
  }
  return raw;
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try to strip markdown fences or extract first JSON object
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function getConceptTokens(keyword: string, description: string): Promise<string[]> {
  const prompt = `You translate a (possibly Korean) keyword into icon-vocabulary tokens.

KEYWORD: ${keyword}
DESCRIPTION: ${description || '(none)'}

List 3 to 5 single-word English concept tokens that this keyword most directly evokes as icon vocabulary. Each token must be a single lowercase English word that is likely to appear as part of an icon name in a Phosphor/Tabler/Lucide-like icon library (e.g. "phone", "user", "cloud", "flask", "microscope", "search", "shield", "chart", "code", "settings", "lock").

Output JSON only: {"tokens": ["word1", "word2", "word3"]}`;

  const raw = await ollama(prompt, 0.3);
  // eslint-disable-next-line no-console
  console.log('[iconCompose] tokens raw:', raw.slice(0, 200));
  const obj = safeParseJson<{ tokens?: unknown }>(raw);
  if (obj && Array.isArray(obj.tokens)) {
    const tokens = obj.tokens
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean)
      .slice(0, 8);
    if (tokens.length > 0) return tokens;
  }
  return [keyword.toLowerCase().trim()].filter(Boolean);
}

export function collectCandidates(tokens: string[], perTokenLimit = 5): Candidate[] {
  const seen = new Set<string>();
  return tokens
    .flatMap((t) => searchIcons(t, perTokenLimit))
    .map((h): Candidate | null => {
      const id = `${h.set}:${h.name}`;
      if (seen.has(id)) return null;
      seen.add(id);
      const bodyMatch = h.svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      const body = bodyMatch?.[1] ?? '';
      if (!body) return null;
      return { id, set: h.set, name: h.name, body };
    })
    .filter((c): c is Candidate => c !== null);
}

export async function composePlan(
  keyword: string,
  description: string,
  candidates: Candidate[],
  variantHint: string,
): Promise<Plan> {
  const candidateList = candidates.map((c) => `- ${c.id}`).join('\n') || '(none)';
  const prompt = `You compose duotone icons by arranging pre-drawn 24x24 base icons in a 512x512 canvas.

KEYWORD: ${keyword}
DESCRIPTION: ${description || '(none)'}
VARIANT HINT: ${variantHint}

Candidate base icons (each has source viewBox 0 0 24 24, format set:name):
${candidateList}

Output a JSON composition plan. Place 1 to 3 base icons and (optionally) 0 to 3 primitive shapes for connectors/badges/backgrounds.

Coordinates:
- Each icon's local origin (0,0) is positioned at (x,y) in the 512 canvas, then scaled by 'scale' (uniformly). The icon spans (x, y) to (x + 24*scale, y + 24*scale).
- **REQUIRED scale range: 12 ~ 18.** Smaller values produce tiny miniatures that look broken — do NOT use scale < 10. A single-icon scene must use scale >= 16.
- **The combined content must fill the safe area (40..472).** Together, all items' bounding boxes should reach within 32 units of every safe-area edge: min(x) ≤ 72, max(x + w) ≥ 440, min(y) ≤ 72, max(y + h) ≥ 440.
- Distinct icons must NOT overlap; primitives may overlap an icon to act as a badge/connector.

Output JSON ONLY (no prose, no code fences):
{
  "items": [
    {"kind":"icon","icon":"set:name","x":number,"y":number,"scale":number,"rotation":0},
    {"kind":"primitive","type":"line","x1":number,"y1":number,"x2":number,"y2":number,"dashed":false},
    {"kind":"primitive","type":"circle","cx":number,"cy":number,"r":number,"fill":true},
    {"kind":"primitive","type":"rect","x":number,"y":number,"width":number,"height":number,"rx":8,"fill":false}
  ]
}

Rules:
- 1~3 "icon" items, 0~3 "primitive" items, total <= 5 items.
- "icon" value must EXACTLY match an id from the candidate list above.
- Integers for x,y,x1,y1,x2,y2,cx,cy,r,width,height,rx; scale can be decimal.
- All shapes must stay within safe area (40..472).
- Output ONLY the JSON object.`;

  const raw = await ollama(prompt, 0.55);
  // eslint-disable-next-line no-console
  console.log('[iconCompose] compose raw:', raw.slice(0, 400));
  const obj = safeParseJson<{ items?: unknown }>(raw);
  if (obj && Array.isArray(obj.items)) {
    return { items: (obj.items as PlanItem[]).slice(0, 6) };
  }
  return { items: [] };
}

// Resolve an LLM-supplied icon id loosely: try exact match, then `name` ending
// match across any set. Local 9B models often drop the set prefix or pick a
// near-but-wrong name; we don't want a 1-character mismatch to wipe the scene.
function resolveCandidate(
  raw: string,
  candidates: Map<string, Candidate>,
  byName: Map<string, Candidate>,
): Candidate | undefined {
  if (!raw) return undefined;
  const direct = candidates.get(raw);
  if (direct) return direct;
  const trimmed = raw.trim().toLowerCase();
  for (const [id, cand] of candidates) {
    if (id.toLowerCase() === trimmed) return cand;
  }
  const noPrefix = trimmed.includes(':') ? trimmed.split(':').pop()! : trimmed;
  return byName.get(noPrefix);
}

// When the LLM gives us nothing usable, fall back to a centered single-icon
// composition so the result is at least non-empty.
function fallbackPlan(candidates: Candidate[]): Plan {
  if (candidates.length === 0) return { items: [] };
  const first = candidates[0]!;
  return {
    items: [
      {
        kind: 'icon',
        icon: first.id,
        x: 80,
        y: 80,
        scale: 14,
        rotation: 0,
      },
    ],
  };
}

function clamp(n: unknown, lo: number, hi: number, dflt: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : dflt;
  return Math.max(lo, Math.min(hi, v));
}

function renderItem(
  item: PlanItem,
  candidates: Map<string, Candidate>,
  byName: Map<string, Candidate>,
): string {
  if (item.kind === 'icon') {
    const cand = resolveCandidate(item.icon, candidates, byName);
    if (!cand) return '';
    const x = clamp(item.x, 0, 472, 40);
    const y = clamp(item.y, 0, 472, 40);
    const scale = clamp(item.scale, 1, 20, 14);
    const rot = clamp(item.rotation, -180, 180, 0);
    const transforms: string[] = [`translate(${x} ${y})`];
    if (scale !== 1) transforms.push(`scale(${scale})`);
    if (rot !== 0) transforms.push(`rotate(${rot})`);
    // Pre-divide stroke-width so the rendered stroke = COMPOSE_NOMINAL_STROKE
    // in viewBox units regardless of group scale. Without this the scale would
    // multiply the inherited stroke, making nested icons look chunky.
    const sw = (COMPOSE_NOMINAL_STROKE / scale).toFixed(3);
    return `<g transform="${transforms.join(' ')}" stroke-width="${sw}">${cand.body}</g>`;
  }
  if (item.type === 'line') {
    const dashed = item.dashed ? ' stroke-dasharray="10 10"' : '';
    return (
      `<line x1="${clamp(item.x1, 0, 512, 0)}" y1="${clamp(item.y1, 0, 512, 0)}" ` +
      `x2="${clamp(item.x2, 0, 512, 0)}" y2="${clamp(item.y2, 0, 512, 0)}"${dashed}/>`
    );
  }
  if (item.type === 'circle') {
    const fill = item.fill ? ' fill="currentColor"' : '';
    return (
      `<circle cx="${clamp(item.cx, 0, 512, 0)}" cy="${clamp(item.cy, 0, 512, 0)}" ` +
      `r="${clamp(item.r, 1, 256, 12)}"${fill}/>`
    );
  }
  if (item.type === 'rect') {
    const rx = item.rx ? ` rx="${clamp(item.rx, 0, 64, 0)}"` : '';
    const fill = item.fill ? ' fill="currentColor"' : '';
    return (
      `<rect x="${clamp(item.x, 0, 512, 0)}" y="${clamp(item.y, 0, 512, 0)}" ` +
      `width="${clamp(item.width, 1, 512, 32)}" height="${clamp(item.height, 1, 512, 32)}"${rx}${fill}/>`
    );
  }
  return '';
}

export function assembleSvg(plan: Plan, candidates: Map<string, Candidate>): string {
  const byName = new Map<string, Candidate>();
  for (const cand of candidates.values()) {
    if (!byName.has(cand.name)) byName.set(cand.name, cand);
  }
  const parts = plan.items
    .map((item) => renderItem(item, candidates, byName))
    .filter(Boolean);
  const root =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" ` +
    `stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">`;
  return `${root}${parts.join('')}</svg>`;
}

const VARIANT_HINTS = [
  'standard composition with a clear primary subject',
  'minimal — one main icon plus a small accent shape',
  'detailed — multiple icons with a connector line',
  'badge style — primary icon plus a filled circle badge',
  'wide horizontal layout filling the canvas',
  'compact stacked vertical layout',
  'with a speech-bubble container around the main symbol',
  'with status indicators or dot markers nearby',
];

// Count icon items in a plan that actually resolve to a candidate.
function planIconResolveCount(plan: Plan, candidates: Map<string, Candidate>): number {
  const byName = new Map<string, Candidate>();
  for (const cand of candidates.values()) {
    if (!byName.has(cand.name)) byName.set(cand.name, cand);
  }
  return plan.items.reduce<number>((acc, item) => {
    if (item.kind !== 'icon') return acc;
    return resolveCandidate(item.icon, candidates, byName) ? acc + 1 : acc;
  }, 0);
}

export async function generateMany(
  keyword: string,
  description: string,
  count: number,
): Promise<GenerateResult[]> {
  const tokens = await getConceptTokens(keyword, description);
  const candidates = collectCandidates(tokens, 5);
  // eslint-disable-next-line no-console
  console.log(
    '[iconCompose] tokens=%o, candidates(%d)=%o',
    tokens,
    candidates.length,
    candidates.map((c) => c.id),
  );
  const candidatesMap = new Map(candidates.map((c) => [c.id, c]));
  const candidateIds = candidates.map((c) => c.id);
  // Sequential calls — local Ollama runs single-threaded, parallelism wouldn't
  // help and would queue requests anyway.
  return Array.from({ length: count }).reduce<Promise<GenerateResult[]>>(
    async (accP, _, i) => {
      const acc = await accP;
      const variantHint = VARIANT_HINTS[i % VARIANT_HINTS.length] ?? VARIANT_HINTS[0]!;
      let plan = await composePlan(keyword, description, candidates, variantHint);
      const resolved = planIconResolveCount(plan, candidatesMap);
      // eslint-disable-next-line no-console
      console.log(
        '[iconCompose] variant %d "%s" plan items=%d (icons resolved=%d)',
        i,
        variantHint,
        plan.items.length,
        resolved,
      );
      if (resolved === 0) {
        plan = fallbackPlan(candidates);
        // eslint-disable-next-line no-console
        console.log('[iconCompose] variant %d falling back to single-icon plan', i);
      }
      const svg = assembleSvg(plan, candidatesMap);
      acc.push({
        svg,
        meta: { tokens, candidates: candidateIds, plan, variantHint },
      });
      return acc;
    },
    Promise.resolve<GenerateResult[]>([]),
  );
}