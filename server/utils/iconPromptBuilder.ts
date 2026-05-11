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

// Take an outline-only iconify body and prepend a filled-currentColor duplicate
// of every <path> so the result reads as a duotone surface + outline overlay.
// The original body comes after the filled layer; rendering order means the
// outline strokes draw ON TOP of the fill, producing the Flaticon Blue look.
// LLMs no longer need to identify the "outermost" path themselves — the body
// is duotone-ready as shipped.
export function duotonizeBody(body: string): string {
  const pathRe = /<path\b[^>]*?\sd="([^"]+)"[^>]*?\/?>/g;
  const filledLayer: string[] = [];
  for (const m of body.matchAll(pathRe)) {
    filledLayer.push(`<path d="${m[1]}" fill="currentColor"/>`);
  }
  if (filledLayer.length === 0) return body;
  return `${filledLayer.join('')}${body}`;
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
        const rawBody = bodyMatch?.[1] ?? '';
        if (rawBody) {
          seenName.add(h.name);
          return {
            id: `${h.set}:${h.name}`,
            set: h.set,
            name: h.name,
            body: duotonizeBody(rawBody),
          };
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
    `These ${refs.length} icons (each in viewBox 0..24) are your BUILDING BLOCKS. Compose your output by placing 1 OR 2 of them on the 512 canvas. Pick whichever fits the keyword best:\n\n` +
    '  - SINGLE-OBJECT keyword (e.g. database, lock, file, gear, calendar): place 1 reference, large.\n' +
    '  - SCENE keyword (e.g. cloud computing, data pipeline, payment flow): place 2 references that depict the relationship.\n' +
    '  - PERSONA keyword (e.g. 연구원, 개발자, scientist): place a person/user reference + a role-specific tool reference (flask, laptop, etc.).\n\n' +
    '## HOW TO PLACE A REFERENCE\n' +
    'Each [REF_i] body below is ALREADY DUOTONE-READY — it contains a filled <path …fill="currentColor"/> layer followed by the outline layer. You do NOT need to add fills or analyse paths yourself.\n' +
    'To place a reference on the 512 canvas, simply paste its body verbatim inside a transform group with vector-effect="non-scaling-stroke":\n' +
    '```\n' +
    '<g transform="translate(X Y) scale(S)" vector-effect="non-scaling-stroke">\n' +
    '  {paste the entire REF body here, exactly as shown — do not modify it}\n' +
    '</g>\n' +
    '```\n' +
    'The vector-effect attribute is CRITICAL. Without it the transform scale (13~17×) would blow the outline stroke up to ~80-100px and the outline would swallow the entire fill, producing a solid blob with no anatomy visible.\n' +
    'The REF bodies are pre-built so the fill layer renders FIRST and the outline strokes draw ON TOP — that\'s the Flaticon Blue duotone look. Just paste verbatim, do not edit the body.\n\n' +
    '## PLACEMENT NUMBERS (use these unless the references need different framing)\n' +
    'SINGLE: <g transform="translate(56 56) scale(17)" vector-effect="non-scaling-stroke">…</g>\n' +
    '   → fills roughly x=56..464, y=56..464 (canvas almost full)\n' +
    'PRIMARY (when composing 2): <g transform="translate(40 80) scale(13)" vector-effect="non-scaling-stroke">…</g>\n' +
    '   → fills roughly x=40..352, y=80..392 (left ~61%)\n' +
    'SECONDARY (when composing 2): <g transform="translate(330 80) scale(7)" vector-effect="non-scaling-stroke">…</g>\n' +
    '   → fills roughly x=330..498, y=80..248 (top-right ~33%)\n' +
    'CONNECTOR (when composing 2): 1 or 2 thin lines tying the two blocks (e.g. primary top-right corner to secondary bottom-left corner). These use the root stroke-width=6 directly (no vector-effect needed).\n' +
    'STATUS MARKER (optional, both modes): one small filled circle or check-mark badge in an empty corner to add the duotone accent.\n\n' +
    '## REFERENCES (pick the ones that best fit the keyword — you don\'t have to use all of them)\n';
  const body = refs
    .map((r, i) => `[REF_${i + 1}] ${r.id}\n${r.body}`)
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

# Variation strategy
The references above are your building blocks — pick 1 OR 2 per item and follow the placement numbers in the reference block. Then add 1~2 connector lines and an optional status marker.

For the ${count} variants, use a DIFFERENT angle each:
  - "standard"     — canonical placement: 1 reference centered & large (SINGLE) OR primary left + secondary top-right (DUAL)
  - "with-detail"  — same placement, with extra inner accent (data markers, small filled rects, indicator dots) layered on top
  - "composed"     — adds a small status badge or check-mark (e.g. cylinder + check, lock + ring, person + ID badge)
  - "with-action"  — adds a directional arrow or motion line (e.g. upload arrow on a cloud, sync curve between devices)
  - "minimal"      — single reference, single duotone surface, no extras beyond one tiny marker
  - "scene"        — two references with a clear connector tying them (e.g. cloud → laptop, database → arrow → check)
  - "in-context"   — adds a thin baseline/desk/ground line under the subject for environmental context
  - "abstract"     — drops the outline-only refinement, keeps only the filled silhouette + 1-2 accent lines
Each item.angle must be unique within the response.

For PERSONA keywords (연구원/개발자/scientist/etc.) the person reference is the primary; the role-specific tool (flask/laptop/stethoscope from the references) is the secondary. Don't invent person anatomy from scratch — use the placed person reference + the placed tool reference. Add a single filled badge (ID card, flask cap, stethoscope head) for the duotone accent.

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
- Use the placement numbers from the reference block. Single mode = 1 reference scaled large, Dual mode = primary left + secondary top-right.
- Each placed reference MUST include vector-effect="non-scaling-stroke" on its <g> wrapper — otherwise the outline becomes too thick and hides the duotone fill underneath.
- bbox must span ≥ 400 on BOTH axes (the placement numbers already guarantee this).
- NEVER draw text characters, letters, letterforms, digits, or word-like glyphs as path/polygon shapes. The icon must read as a silhouette, not a logo.
- NEVER add antennas, ear-pieces, decorative dots, sparkles, or any element not used in normal icon vocabulary.

If a draft would emit a tiny isolated outline shape, redraw using the placement numbers — a miniature in the center is rejected.
Output the final JSON immediately — no thinking trace, no reasoning summary, no preface, no markdown fences. If your environment has extended thinking, keep it brief: emit the JSON as soon as the items are ready.

# Output — ONE JSON object with an "items" array of EXACTLY ${count} icon${count === 1 ? '' : 's'}. NO prose. NO code fences. NO comments inside the JSON.

Pre-output self-check (MENTAL ONLY — do NOT echo this checklist or any reasoning in your output, also do NOT echo the outermost-path-duplicate technique — the REF bodies are already duotone-ready):
  [ ] viewBox is exactly "0 0 512 512"
  [ ] stroke-width="6" on root svg
  [ ] No hex / rgb / fill-opacity / stroke-opacity / opacity attributes anywhere
  [ ] Each placed reference is wrapped in <g transform="translate(X Y) scale(S)" vector-effect="non-scaling-stroke"> and the REF body is pasted verbatim (no editing of fills or paths)
  [ ] bbox spans ≥ 400 on both axes (placement numbers handle this)
  [ ] No text characters, letterforms, antennas, or decorative additions present
  [ ] item.angle is one of the listed values AND unique across items
If any check fails for an item, silently regenerate THAT item internally — then emit ONLY the final JSON object.

Shape of every item:
  - name: string — copy the KEYWORD as-is.
  - tags: array of 3~6 lowercase single-word English tags.
  - category: one lowercase English word.
  - angle: ONE of "standard", "with-detail", "composed", "with-action", "minimal", "scene", "in-context", "abstract". Each item picks a DIFFERENT angle.
  - svg: a complete standalone <svg ...>...</svg> string. Must start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"> and end with </svg>. Escape the inner " as \\". Do NOT wrap items inside a parent svg; each item.svg stands alone.

Exact example of the required output shape (this example is the format only — your content must match the KEYWORD above, NOT "Dashboard"):
{"items":[{"name":"Dashboard","tags":["analytics","data","ui"],"category":"ui","angle":"window-scene","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><rect x=\\"40\\" y=\\"80\\" width=\\"432\\" height=\\"352\\" rx=\\"24\\"/><circle cx=\\"80\\" cy=\\"115\\" r=\\"6\\" fill=\\"currentColor\\"/><circle cx=\\"116\\" cy=\\"115\\" r=\\"6\\" fill=\\"currentColor\\"/><rect x=\\"200\\" y=\\"100\\" width=\\"240\\" height=\\"32\\" rx=\\"6\\" fill=\\"currentColor\\"/></svg>"}]}

Reference-composition example (SINGLE mode — pretend REF_1 is a cylinder body):
{"items":[{"name":"Database","tags":["database","storage","sql"],"category":"data","angle":"standard","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 512 512\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"6\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><g transform=\\"translate(56 56) scale(17)\\" vector-effect=\\"non-scaling-stroke\\"><path d=\\"M4 6a8 3 0 1 0 16 0A8 3 0 1 0 4 6\\" fill=\\"currentColor\\"/><g fill=\\"none\\" stroke=\\"currentColor\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M4 6a8 3 0 1 0 16 0A8 3 0 1 0 4 6\\"/><path d=\\"M4 6v6a8 3 0 0 0 16 0V6\\"/><path d=\\"M4 12v6a8 3 0 0 0 16 0v-6\\"/></g></g><circle cx=\\"430\\" cy=\\"100\\" r=\\"28\\" fill=\\"currentColor\\"/><path d=\\"M418 100 L428 110 L444 92\\" stroke=\\"currentColor\\" stroke-width=\\"4\\" fill=\\"none\\"/></svg>"}]}
(The duplicated cylinder top with fill="currentColor" sits behind the outline group; vector-effect="non-scaling-stroke" keeps the outline at 6px regardless of the scale(17). Result: filled cylinder body + visible outline + status badge in the corner.)

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
