// Local Ollama 로 키워드 + 설명 → bilingual 메타 (한/영) 추론.
// 실패 시 throw — 호출부가 catch 해서 사용자 흐름을 막지 않도록 처리.

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 30_000;

export type SuggestMetaInput = {
  keyword: string;
  description?: string;
  // 라이브러리에 이미 등록된 카테고리·태그 — soft hint 로 LLM 컨텍스트에 포함.
  // 강제 매칭 아님: 적합한 게 있으면 재사용, 없으면 새로 만들도록.
  existingCategories?: string[];
  existingTags?: string[];
};

export type Bilingual = { ko: string; en: string };
export type BilingualTags = { ko: string[]; en: string[] };

export type SuggestMetaResult = {
  name: Bilingual; // en: kebab-case
  category: Bilingual;
  tags: BilingualTags;
};

export function toKebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// kebab 문자열을 maxLen 이내로 자르되, 가능하면 하이픈 경계에서 끊어 단어 중간 절단 회피.
// makeSlug 의 절단 규칙과 동일 — 다운로드 파일명이 되는 slug 와 일관된 모양을 보장.
function truncateKebab(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const lastHyphen = cut.lastIndexOf('-');
  return lastHyphen >= Math.floor(maxLen / 2)
    ? cut.slice(0, lastHyphen)
    : cut.replace(/-+$/g, '');
}

function cleanStr(s: unknown, max: number): string {
  return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

function cleanBilingual(
  raw: unknown,
  opts: { kebabEn: boolean; maxKo: number; maxEn: number }
): Bilingual {
  if (!raw || typeof raw !== 'object') return { ko: '', en: '' };
  const o = raw as Record<string, unknown>;
  const ko = cleanStr(o.ko, opts.maxKo);
  let en = typeof o.en === 'string' ? o.en.trim() : '';
  if (opts.kebabEn) {
    en = truncateKebab(toKebab(en), opts.maxEn);
  } else {
    en = en.toLowerCase().slice(0, opts.maxEn);
  }
  return { ko, en };
}

// 언어당 최대 5 개 — 너무 많은 태그는 UI 에서 시각적으로 부담스럽고, 검색 매칭에도 5 개면 충분.
const MAX_TAGS_PER_LANG = 5;

function cleanTagList(raw: unknown, transform: (s: string) => string): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => (typeof t === 'string' ? transform(t.trim()) : ''))
    .filter((t) => t.length > 0 && t.length <= 30)
    .slice(0, MAX_TAGS_PER_LANG);
}

const CODE_FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

export function parseSuggestion(text: string): SuggestMetaResult {
  let s = text.trim();
  const fenced = s.match(CODE_FENCE);
  if (fenced) {
    const [, inner] = fenced;
    if (inner) s = inner.trim();
  }
  if (!s.startsWith('{')) {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) [s] = m;
  }

  let json: unknown;
  try {
    json = JSON.parse(s);
  } catch (e) {
    throw new Error(`parseSuggestion: invalid JSON — ${(e as Error).message}`);
  }
  if (!json || typeof json !== 'object') {
    throw new Error('parseSuggestion: JSON is not an object');
  }
  const obj = json as Record<string, unknown>;

  // name.en 은 다운로드 파일명(slug)로 들어가므로 짧게 강제.
  const name = cleanBilingual(obj.name, { kebabEn: true, maxKo: 32, maxEn: 32 });
  const category = cleanBilingual(obj.category, {
    kebabEn: false,
    maxKo: 30,
    maxEn: 30,
  });

  const tagsObj =
    obj.tags && typeof obj.tags === 'object' && !Array.isArray(obj.tags)
      ? (obj.tags as Record<string, unknown>)
      : {};
  const tagsKo = cleanTagList(tagsObj.ko, (t) => t);
  const tagsEn = cleanTagList(tagsObj.en, (t) => t.toLowerCase());

  const hasAny =
    name.ko.length > 0 ||
    name.en.length > 0 ||
    category.ko.length > 0 ||
    category.en.length > 0 ||
    tagsKo.length > 0 ||
    tagsEn.length > 0;
  if (!hasAny) {
    throw new Error('parseSuggestion: no usable fields present');
  }

  return { name, category, tags: { ko: tagsKo, en: tagsEn } };
}

const SYSTEM_PROMPT = `You are an icon metadata generator. Given a keyword and an optional description, output JSON with bilingual metadata in this exact shape:

{
  "name":     { "ko": "<Korean human-readable name, 1-3 words, ≤ 32 chars>",
                "en": "<lowercase kebab-case English name, 1-3 words, ≤ 32 chars, hyphens only — this becomes the download filename slug>" },
  "category": { "ko": "<Korean noun, 1-2 words>",
                "en": "<English noun, lowercase, ≤ 30 chars>" },
  "tags":     { "ko": ["<3-5 Korean tags>"],
                "en": ["<3-5 English lowercase tags>"] }
}

Naming guideline — when a well-known canonical or domain-standard term exists, prefer it over a literal translation:
- "유전자 가위"   → name { ko:"유전자 가위",  en:"crispr" }            (CRISPR is the canonical term)
- "인공지능"      → name { ko:"인공지능",     en:"ai" }
- "사물인터넷"    → name { ko:"사물인터넷",   en:"iot" }
- "머신러닝"      → name { ko:"머신러닝",     en:"machine-learning" }
- "신용카드 결제" → name { ko:"신용카드 결제", en:"credit-card-payment" }
- "데이터베이스"  → name { ko:"데이터베이스", en:"database" }
- "클라우드"      → name { ko:"클라우드",     en:"cloud" }, category { ko:"인프라", en:"infrastructure" }

If no canonical term exists, fall back to a direct translation. The "ko" name should stay close to the user's keyword unless a more recognizable Korean term exists.

Ambiguity guideline — for polysemous keywords (Korean homonyms or terms with multiple senses, e.g. "도메인" = field / DNS / business domain), prefer the most general / literal everyday meaning over a niche technical domain. Only pick a narrow specialized category when the keyword unambiguously points there.

Output ONLY the JSON object — no prose, no code fences.`;

function buildOllamaPrompt(input: SuggestMetaInput): string {
  const keyword = input.keyword.trim();
  const description = (input.description ?? '').trim();
  const cats = (input.existingCategories ?? []).filter(s => s.length > 0);
  const tagHints = (input.existingTags ?? []).filter(s => s.length > 0);

  // 기존 메타가 있으면 soft hint 로 추가 — LLM 이 일관성을 위해 재사용하도록.
  // 강제 아님: 새 키워드가 기존 어느 것에도 맞지 않으면 새로 만들어도 됨.
  let hintBlock = '';
  if (cats.length > 0 || tagHints.length > 0) {
    const lines: string[] = [];
    lines.push('Library context — these terms already exist in the library. Use them ONLY when they clearly fit the keyword; otherwise create fresh categories/tags appropriate for this keyword (do not force-fit just because a term is in the list):');
    if (cats.length > 0) lines.push(`- existing categories: ${cats.join(', ')}`);
    if (tagHints.length > 0) lines.push(`- existing tags: ${tagHints.join(', ')}`);
    hintBlock = `\n${lines.join('\n')}\n`;
  }

  return `${SYSTEM_PROMPT}
${hintBlock}
Keyword: ${keyword}
Description: ${description || '(none)'}

JSON:`;
}

export async function suggestMeta(input: SuggestMetaInput): Promise<SuggestMetaResult> {
  if (!input.keyword.trim()) {
    throw new Error('suggestMeta: keyword required');
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), OLLAMA_TIMEOUT_MS);

  let raw: string;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildOllamaPrompt(input),
        format: 'json',
        stream: false,
        // qwen3.5 등 reasoning 모델은 think 모드 시 응답을 thinking 필드로 보내고 response 가 빔.
        // 명시적으로 끄고, 그래도 thinking 필드에 본문이 있으면 폴백.
        think: false,
      }),
      signal: ctl.signal,
    });
    if (!res.ok) {
      throw new Error(`ollama HTTP ${res.status}`);
    }
    const body = (await res.json()) as { response?: string; thinking?: string };
    const response = typeof body.response === 'string' ? body.response : '';
    const thinking = typeof body.thinking === 'string' ? body.thinking : '';
    raw = response.length > 0 ? response : thinking;
  } finally {
    clearTimeout(t);
  }

  if (!raw) throw new Error('suggestMeta: empty response from ollama');
  return parseSuggestion(raw);
}
