/**
 * Dynamic prompt builder.
 *
 * Ollama (local 9B) is used for what it can do well: translate the (often
 * Korean) keyword into English vocabulary tokens. The library index then
 * supplies a handful of reference SVG bodies for those tokens, and we hand
 * the assembled prompt to the user to paste into a stronger cloud model
 * (Claude / GPT) that handles the actual synthesis.
 */

import { searchIcons, type SearchResult } from './iconIndex';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60_000;

export type Reference = {
  id: string; // e.g. "tabler:flask"
  set: string;
  name: string;
  body: string; // inner SVG markup (no <svg> wrapper)
};

export type BuildPromptResult = {
  prompt: string;
  tokens: string[];
  references: Reference[];
};

async function ollamaCall(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        think: false,
        format: 'json',
        options: { temperature: 0.3 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const j = (await res.json()) as { response?: string; thinking?: string };
    if (j.response) return j.response;
    if (j.thinking) {
      const m = j.thinking.match(/\{[\s\S]*\}/);
      if (m) return m[0];
    }
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

const PERSONA_HINTS: Record<string, string[]> = {
  // Korean keywords
  '연구원':    ['person', 'scientist', 'researcher', 'lab', 'flask'],
  '연구자':    ['person', 'scientist', 'researcher', 'lab'],
  '과학자':    ['person', 'scientist', 'lab'],
  '개발자':    ['person', 'developer', 'laptop', 'code'],
  '엔지니어':   ['person', 'engineer', 'gear', 'wrench'],
  '의사':      ['person', 'doctor', 'stethoscope'],
  '간호사':    ['person', 'nurse', 'medical'],
  '교사':      ['person', 'teacher', 'book'],
  '학생':      ['person', 'student', 'book'],
  '디자이너':   ['person', 'designer', 'palette'],
  '분석가':    ['person', 'analyst', 'chart'],
  '전문가':    ['person', 'expert'],
  // English keywords (lowercase for matching)
  scientist:  ['person', 'scientist', 'lab', 'flask'],
  researcher: ['person', 'researcher', 'lab', 'microscope'],
  developer:  ['person', 'developer', 'laptop', 'code'],
  engineer:   ['person', 'engineer', 'gear'],
  doctor:     ['person', 'doctor', 'stethoscope'],
  teacher:    ['person', 'teacher', 'book'],
  designer:   ['person', 'designer', 'palette'],
  analyst:    ['person', 'analyst', 'chart'],
};

export async function getConceptTokens(
  keyword: string,
  description: string,
): Promise<string[]> {
  // Persona shortcut: skip ollama when the keyword is a known persona — keeps
  // "person" as the first token so collectReferences guarantees a person ref.
  const exact = keyword.trim();
  const lower = exact.toLowerCase();
  const hint = PERSONA_HINTS[exact] ?? PERSONA_HINTS[lower];
  if (hint) return [...hint];

  const prompt = `You translate a (possibly Korean) keyword into icon-vocabulary tokens.

KEYWORD: ${keyword}
DESCRIPTION: ${description || '(none)'}

List 4 to 6 single-word English concept tokens that this keyword evokes in icon libraries. Each token must be a single lowercase English word, common in icon names like "phone", "user", "flask", "microscope", "lock", "cloud", "chart", "code", "settings".

Output JSON only: {"tokens": ["word1", "word2", ...]}`;

  const raw = await ollamaCall(prompt);
  // eslint-disable-next-line no-console
  console.log('[buildPrompt] tokens raw:', raw.slice(0, 200));
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

// Pull up to ~maxTotal references that maximise *visual* diversity:
// - dedupe by icon NAME (not just `set:name`) so e.g. tabler:database and
//   lucide:database don't both consume a slot
// - round-robin across tokens so every concept gets at least one reference
//   before any one token gobbles all slots
function collectReferences(tokens: string[], maxTotal = 5): Reference[] {
  const perToken: SearchResult[][] = tokens.map((t) => searchIcons(t, 4));
  const seenName = new Set<string>();
  const out: Reference[] = [];
  const cursors = tokens.map(() => 0);
  let exhausted = false;
  // Take the next yet-unseen result for token `i`, advancing its cursor.
  const takeNext = (i: number): Reference | null => {
    const hits = perToken[i]!;
    while (cursors[i]! < hits.length) {
      const h = hits[cursors[i]!]!;
      cursors[i]! += 1;
      if (seenName.has(h.name)) {
        // already-picked name (e.g. same icon in another set) — skip
      } else {
        const bodyMatch = h.svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        const body = bodyMatch?.[1] ?? '';
        if (body) {
          seenName.add(h.name);
          return { id: `${h.set}:${h.name}`, set: h.set, name: h.name, body };
        }
      }
    }
    return null;
  };

  while (out.length < maxTotal && !exhausted) {
    exhausted = true;
    for (let i = 0; i < perToken.length && out.length < maxTotal; i += 1) {
      const ref = takeNext(i);
      if (ref) {
        out.push(ref);
        exhausted = false;
      }
    }
  }
  return out;
}

function renderReferenceBlock(refs: Reference[]): string {
  if (refs.length === 0) {
    return '(no library references — synthesize from scratch using the style guide alone)';
  }
  const header =
    'These references show LINE ANATOMY only (viewBox 0..24).\n' +
    'You MUST reproduce the STRUCTURE but at 512 scale (×21.3) and WITH duotone fills added.\n' +
    'stroke-width=6 at 512 reads as a bold ~16px stroke — match that visual weight.\n' +
    'Do NOT keep your output outline-only just because the references are outline-only.\n';
  const body = refs
    .map((r, i) => `[REF_${i + 1}] ${r.id} (viewBox 0 0 24 24)\n${r.body}`)
    .join('\n\n');
  return `${header}\n${body}`;
}

function renderPrompt(
  keyword: string,
  description: string,
  count: number,
  tokens: string[],
  references: Reference[],
): string {
  return `Create ${count} distinct duotone SVG icon${count === 1 ? '' : 's'} for the keyword below in a clean Flaticon Blue Duotone style.

KEYWORD: ${keyword}
DESCRIPTION: ${description || '(none)'}
CONCEPT VOCABULARY: ${tokens.join(', ') || '(none)'}

# Style (mandatory)
- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
- Two solid tones from ONE color (rendered externally): outlines render as the dark tone, fill="currentColor" renders as the medium tone.
- Use fill="currentColor" on interior content panels, screens, badges, and small markers. Leave outer container/device outlines unfilled.
- NEVER use fill-opacity, stroke-opacity, opacity, inline style, hex/rgb colors. Only "currentColor" and "none".
- Allowed nodes: rect, circle, line, polyline, polygon, ellipse, path. Optional <g transform="translate(...) scale(...) rotate(...)">. No defs / gradients / masks / filters / scripts / images.

# Composition
- Safe area x=40..472, y=40..472.
- **CRITICAL — fill the canvas.** Each item's content bounding box MUST satisfy ALL FOUR conditions:
  - min(x of any shape) ≤ 56
  - max(x + width of any shape) ≥ 456
  - min(y of any shape) ≤ 56
  - max(y + height of any shape) ≥ 456
  - In other words, the icon visually spans ≥ 400 units on BOTH axes. A miniature in the center (e.g. spanning only 200~300 units) is INVALID — discard and redraw bigger.
  - For single-centered (atomic concept): the main object's overall bounding box should be roughly x=64..448, y=64..448 — a bold object that occupies most of the canvas. Use proportions appropriate to the subject (cylinder: tall, file: tall, gear: square, chart: wide).
  - For window/dashboard scenes: outer chrome rect roughly x=40..472, y=80..432.
  - For device-stack: left device x=40..240, right device x=272..472.
  - For network/scene: at least one element touches y≈40~80, and at least one touches y≈420~472.
- 14~24 primitive shapes per icon. Integer coordinates, multiples of 4 preferred. Rounded corners (rx 4~24) on most rects.

# Variation strategy — pick what fits the keyword
First, classify the KEYWORD by its semantic shape:

A) **Atomic concept** (a single thing) — examples: database, lock, file, gear, key, document, cart, calendar, bell, chart.
   → Generate ${count} variations of the SAME single-centered subject. Vary internal anatomy, density, and accent details. Do NOT introduce unrelated dashboard chrome, networks, or paired devices.
   → Suggested per-variant differentiation:
     • variant 1 — standard: clean canonical rendering, bold central object with essential anatomy (12~16 shapes).
     • variant 2 — with-detail: same object but with extra inner content (cells, indicators, labels, markers).
     • variant 3 — composed: same object paired with ONE small accent (status dot, badge, arrow, secondary marker).
   Beyond 3, add stylistic variants (slight rotation, alternative anatomy emphasis), still single-centered.

B) **Scene / workflow concept** — examples: dashboard, analytics, payment flow, file upload, code review.
   → Use ${count} DIFFERENT scene patterns from this menu:
     • window-scene (browser/dashboard chrome with traffic dots + URL bar + sidebar + content cards)
     • device-stack (two outlined devices side-by-side, each with one filled inner panel)
     • network (3-bump cloud + 1~2 devices + connector lines, some dashed)
     • container-inside (one large outline holding inner cluster)

C) **Paired / relational concept** — examples: sync, exchange, send-receive, compare.
   → Use device-stack / network / container-inside patterns; avoid window-scene.

D) **Persona / role concept** — examples: scientist, researcher, doctor, engineer,
   teacher, designer, analyst, 연구원, 개발자, 학생, 의사, 디자이너.
   → Primary subject MUST be a person occupying y=64..448 vertically.
   → Person anatomy (8 required parts):
       • Head circle (cx≈256, cy≈128, r≈48)
       • Hair / cap shape on top of head (path or filled polygon) — FILLED
       • 2 eye dots (small fill circles cx-256±16, cy≈128)
       • Glasses (2 small rects + bridge line) OR role-specific cap line
       • Neck line / shoulder span at y≈196 (width ≥ 160)
       • Body / coat outline (rect or trapezoid, y=200..420, width ≥ 240)
       • Coat collar V (path inside body, FILLED with currentColor)
       • Internal coat detail (2~3 button circles + chest pocket rect + side seam line)
   → Role-specific tool (≥ 1 required, occupying remaining canvas):
       researcher / scientist / 연구원 → flask OR microscope (right of person, x≈360..448)
       developer  / 개발자             → laptop OR terminal (paired left/right)
       doctor     / 의사                → stethoscope OR clipboard
       engineer   / 엔지니어           → gear OR wrench OR hard-hat marker
       teacher    / 교사                → book OR chalkboard
   → Shape budget: person ≥ 8 + tool ≥ 6 + base/connector ≥ 2 = 16~24 shapes.
   → IMPORTANT: when KEYWORD classifies as D, use ONLY the persona angle enum below.
     Do not mix in atomic/scene angles like "with-action", "composed", "scene".

For the KEYWORD "${keyword}", first decide A / B / C / D, then generate the ${count} variants accordingly.
The item.angle enum depends on the category:
  A (atomic)  → "standard", "with-detail", "composed"
  B (scene)   → "window-scene", "device-stack", "network", "container-inside"
  C (paired)  → "device-stack", "network", "container-inside"
  D (persona) → "standard", "with-tool", "with-detail", "minimal", "in-context", "abstract"
Each item.angle must be unique within the response.

# Library reference vocabulary
${renderReferenceBlock(references)}

# Duotone fill mandate
Every reference shown above is outline-only (no fills). Your output MUST add
fill="currentColor" to the following surface categories whenever they appear:

  Screens / panels   : laptop·monitor screens, phone displays, dashboard inner panels
  Containers         : speech-bubble interiors, card bodies, badge backgrounds, signs
  Solid markers     : chart bars, status dots, progress fills, buttons, traffic-light dots
  Body / clothing    : lab-coat torsos, shirt fronts, helmet caps, vehicle bodies (large)
  Hair / cap         : hair masses, beanie/hat surfaces

Leave OUTLINE-only (no fill):
  Outer device chassis (phone body, laptop hinge, monitor frame outer rect)
  Container frames (window outer rect, briefcase outer)
  Decorative trim, antenna/cable lines, connectors

Each item.svg must contain ≥ 3 fill="currentColor" shapes. Pure outline items are INVALID.

# LAST REMINDER before output
For EACH item:
- bbox must span ≥ 400 on BOTH axes (min ≤ 56, max ≥ 456 on x AND y).
- ≥ 3 shapes use fill="currentColor".
- 14~24 primitive shapes total.
- For persona keyword: head circle exists at y ≤ 180 AND body shape ≥ 240 wide.

If any of these fails, REDRAW before emitting. A miniature in the center is rejected.

# Output — ONE JSON object with an "items" array of EXACTLY ${count} icon${count === 1 ? '' : 's'}. NO prose. NO code fences. NO comments inside the JSON.

Pre-output self-check (for every item, mentally verify):
  [ ] viewBox is exactly "0 0 512 512"
  [ ] stroke-width="6" on root svg
  [ ] No hex / rgb / fill-opacity / stroke-opacity / opacity attributes anywhere
  [ ] min(any shape x) ≤ 56 AND max(x+width) ≥ 456
  [ ] min(any shape y) ≤ 56 AND max(y+height) ≥ 456
  [ ] Count of fill="currentColor" shapes ≥ 3
  [ ] Total primitive shape count ∈ [14, 24]
  [ ] If KEYWORD is persona: head circle present AND body width ≥ 240
  [ ] item.angle is one of the listed values AND unique across items
If any check fails for an item, regenerate THAT item before emitting JSON.

Shape of every item:
  - name: string — copy the KEYWORD as-is.
  - tags: array of 3~6 lowercase single-word English tags.
  - category: one lowercase English word.
  - angle: ONE of "standard", "with-action", "minimal", "composed", "scene", "abstract". Each item picks a DIFFERENT angle.
  - svg: a complete standalone <svg ...>...</svg> string. Must start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"> and end with </svg>. Escape the inner " as \\". Do NOT wrap items inside a parent svg; each item.svg stands alone.

Exact example of the required output shape (this example is the format only — your content must match the KEYWORD above, NOT "Dashboard"):
{"items":[{"name":"Dashboard","tags":["analytics","data","ui"],"category":"ui","angle":"window-scene","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><rect x=\\"40\\" y=\\"80\\" width=\\"432\\" height=\\"352\\" rx=\\"24\\"/><circle cx=\\"80\\" cy=\\"115\\" r=\\"6\\" fill=\\"currentColor\\"/><circle cx=\\"116\\" cy=\\"115\\" r=\\"6\\" fill=\\"currentColor\\"/><rect x=\\"200\\" y=\\"100\\" width=\\"240\\" height=\\"32\\" rx=\\"6\\" fill=\\"currentColor\\"/></svg>"}]}

Persona example (use only when KEYWORD classifies as D):
{"items":[{"name":"Researcher","tags":["scientist","lab","flask","person"],"category":"persona","angle":"standard","svg":"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' fill='none' stroke='currentColor' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'><circle cx='200' cy='128' r='48'/><path d='M160 100 Q160 64 200 64 Q240 64 240 100 Q236 88 224 88 Q200 96 176 88 Q164 90 160 100Z' fill='currentColor'/><circle cx='188' cy='128' r='4' fill='currentColor'/><circle cx='212' cy='128' r='4' fill='currentColor'/><line x1='140' y1='196' x2='260' y2='196'/><path d='M120 420 Q116 280 156 240 L188 232 L188 264 Q200 280 212 264 L212 232 L244 240 Q284 280 280 420 Z' fill='currentColor'/><path d='M188 232 L200 260 L212 232'/><circle cx='200' cy='316' r='5' fill='currentColor'/><circle cx='200' cy='344' r='5' fill='currentColor'/><rect x='232' y='272' width='32' height='24' rx='4'/><line x1='260' y1='260' x2='260' y2='412'/><rect x='340' y='240' width='60' height='24' rx='4'/><path d='M348 264 L344 320 Q320 360 332 408 Q360 432 408 408 Q420 360 396 320 L392 264' fill='currentColor'/><line x1='332' y1='360' x2='408' y2='360'/><line x1='354' y1='284' x2='386' y2='284'/></svg>"}]}

Constraints:
- items.length === ${count}.
- Each item.angle is unique across items.
- Each item.svg is independent — do NOT merge multiple variants into one svg.
- Reply is a SINGLE JSON object only. First character "{". Last character "}". No \`\`\` fences, no leading/trailing text.`;
}

export async function buildPrompt(
  keyword: string,
  description: string,
  count: number,
): Promise<BuildPromptResult> {
  const tokens = await getConceptTokens(keyword, description);
  const isPersona = tokens[0] === 'person';
  const references = collectReferences(tokens, isPersona ? 6 : 5);
  // eslint-disable-next-line no-console
  console.log(
    '[buildPrompt] tokens=%o references=%o isPersona=%s',
    tokens,
    references.map((r) => r.id),
    isPersona,
  );
  return {
    prompt: renderPrompt(keyword, description, count, tokens, references),
    tokens,
    references,
  };
}
