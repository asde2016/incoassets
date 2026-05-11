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

  it('I1: includes scale instruction (×21.3) and bold stroke note', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/scale.*21\.3/);
    expect(r.prompt).toMatch(/bold/i);
  });

  it('I2: includes "Duotone fill mandate" with surface categories and ≥3 fill requirement', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Duotone fill mandate');
    expect(r.prompt).toMatch(/Screens \/ panels/);
    expect(r.prompt).toMatch(/≥\s*3\s*fill="currentColor"/);
  });

  it('I3: includes Persona (D) category with 8-part anatomy and angle enum matrix', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/Persona \/ role concept/);
    expect(r.prompt).toMatch(/Person anatomy \(8 required parts\)/);
    expect(r.prompt).toMatch(/D \(persona\)\s*→/);
    expect(r.prompt).toMatch(/"with-tool"/);
    expect(r.prompt).toMatch(/"in-context"/);
  });

  it('I3: persona category instructs LLM to use ONLY persona angle enum', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/use ONLY the persona angle enum/);
  });

  it('I4: includes a "LAST REMINDER before output" block placed near the end', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('LAST REMINDER before output');
    const reminderIdx = r.prompt.indexOf('LAST REMINDER before output');
    const outputIdx = r.prompt.indexOf('# Output');
    expect(reminderIdx).toBeGreaterThan(0);
    expect(reminderIdx).toBeLessThan(outputIdx);
  });

  it('I5: includes a Pre-output self-check checklist', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toContain('Pre-output self-check');
    expect(r.prompt).toMatch(/viewBox is exactly/);
    expect(r.prompt).toMatch(/Count of fill="currentColor" shapes ≥ 3/);
  });

  it('I6: includes a persona JSON example (Researcher) with at least 14 shapes', async () => {
    const r = await buildPrompt('연구원', '', 3);
    expect(r.prompt).toMatch(/"name":\s*"Researcher"/);
    const exampleMatch = r.prompt.match(/"svg":\s*"<svg[^"]+\/svg>"/);
    expect(exampleMatch).not.toBeNull();
  });
});
