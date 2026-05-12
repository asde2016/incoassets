// Local Ollama 로 키워드 + 설명 → 카테고리(한국어 1-2 단어) / 태그(영문 lowercase 3-7개) 추론.
// 실패 시 throw — 호출부가 catch 해서 사용자 흐름을 막지 않도록 처리.

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 30_000;

export type SuggestMetaInput = {
  keyword: string;
  description?: string;
};

export type SuggestMetaResult = {
  name: string;
  category: string;
  tags: string[];
};

const CODE_FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

export function parseSuggestion(text: string): SuggestMetaResult {
  let s = text.trim();
  const fenced = s.match(CODE_FENCE);
  if (fenced) s = fenced[1]!.trim();
  // ollama format:json 이 아닌 mode 에서도 안전하게 — `{...}` 부분만 추출
  if (!s.startsWith('{')) {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) s = m[0];
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

  const name = typeof obj.name === 'string' ? obj.name.trim().slice(0, 64) : '';
  const category = typeof obj.category === 'string' ? obj.category.trim() : '';
  const tagsRaw = Array.isArray(obj.tags) ? obj.tags : [];
  const tags = tagsRaw
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter((t) => t.length > 0 && t.length <= 30)
    .slice(0, 7);

  if (!name && !category && tags.length === 0) {
    throw new Error('parseSuggestion: no usable fields present');
  }
  return { name, category, tags };
}

const SYSTEM_PROMPT = `You are an icon metadata generator. Given a keyword and an optional description, output JSON with:
- "name": a short Korean human-readable name (1-3 words, ≤ 32 chars) — 예: "신용카드 결제", "클라우드 데이터", "사용자 프로필"
- "category": one short Korean noun (1-2 words) describing the icon's domain — 예: "결제", "사용자", "데이터"
- "tags": array of 3-7 English lowercase tags (single words or hyphen-joined), each ≤ 30 chars

Output ONLY the JSON object — no prose, no code fences.`;

function buildOllamaPrompt(input: SuggestMetaInput): string {
  const keyword = input.keyword.trim();
  const description = (input.description ?? '').trim();
  return `${SYSTEM_PROMPT}

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
      }),
      signal: ctl.signal,
    });
    if (!res.ok) {
      throw new Error(`ollama HTTP ${res.status}`);
    }
    const body = (await res.json()) as { response?: string };
    raw = typeof body.response === 'string' ? body.response : '';
  } finally {
    clearTimeout(t);
  }

  if (!raw) throw new Error('suggestMeta: empty response from ollama');
  return parseSuggestion(raw);
}
