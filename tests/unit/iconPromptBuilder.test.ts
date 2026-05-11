import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConceptTokens, buildPrompt } from '~/server/utils/iconPromptBuilder';

describe('getConceptTokens', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns persona hint tokens without calling ollama for "연구원"', async () => {
    const tokens = await getConceptTokens('연구원', '');
    expect(tokens[0]).toBe('person');
    expect(tokens).toContain('scientist');
    expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('returns persona hint tokens for English persona keywords (case-insensitive)', async () => {
    const tokens = await getConceptTokens('Developer', '');
    expect(tokens[0]).toBe('person');
    expect(tokens).toContain('laptop');
  });

  it('falls through to ollama for non-persona keyword', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ tokens: ['database', 'storage', 'sql'] }) }),
    });
    const tokens = await getConceptTokens('데이터베이스', '');
    expect(tokens).toContain('database');
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('falls back to keyword itself when ollama returns empty', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ response: '{}' }),
    });
    const tokens = await getConceptTokens('weird-thing', '');
    expect(tokens).toEqual(['weird-thing']);
  });
});

describe('buildPrompt — persona reference count', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests up to 6 references for persona keyword (vs 5 for non-persona)', async () => {
    const personaResult = await buildPrompt('연구원', '', 3);
    // PERSONA_HINTS for 연구원 has 5 tokens; collectReferences with maxTotal=6
    // should yield close to 6 refs (allowing for dedup overlap).
    expect(personaResult.references.length).toBeGreaterThanOrEqual(4);
    expect(personaResult.tokens[0]).toBe('person');
  });
});

describe('renderPrompt output content', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes BUILDING BLOCKS language framing references as composition primitives', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/BUILDING BLOCKS/);
  });

  it('teaches the transform wrap technique with explicit translate/scale numbers', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/transform="translate\(X Y\) scale\(S\)"/);
    // Single mode placement number
    expect(r.prompt).toMatch(/translate\(56 56\) scale\(17\)/);
    // Dual mode primary placement
    expect(r.prompt).toMatch(/translate\(40 80\) scale\(13\)/);
  });

  it('allows BOTH single and dual reference modes (no forced composition)', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/SINGLE-OBJECT keyword/);
    expect(r.prompt).toMatch(/SCENE keyword/);
    expect(r.prompt).toMatch(/PERSONA keyword/);
  });

  it('Duotone fill mandate section retained with surface categories', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Duotone fill mandate');
    expect(r.prompt).toMatch(/Screens \/ panels/);
    expect(r.prompt).toMatch(/≥\s*3\s*fill="currentColor"/);
  });

  it('LAST REMINDER block sits before the # Output section', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('LAST REMINDER before output');
    const reminderIdx = r.prompt.indexOf('LAST REMINDER before output');
    const outputIdx = r.prompt.indexOf('# Output');
    expect(reminderIdx).toBeGreaterThan(0);
    expect(reminderIdx).toBeLessThan(outputIdx);
  });

  it('Pre-output self-check is present, mental-only, and references the wrap rule', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Pre-output self-check');
    expect(r.prompt).toMatch(/MENTAL ONLY/);
    expect(r.prompt).toMatch(/vector-effect="non-scaling-stroke"/);
    expect(r.prompt).toMatch(/REF body is pasted verbatim/);
  });

  it('includes a reference-composition Database example demonstrating SINGLE mode', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/"name":\s*"Database"/);
    expect(r.prompt).toMatch(/Reference-composition example/);
  });
});
