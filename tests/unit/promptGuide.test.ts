import { describe, it, expect } from 'vitest';
import { buildPrompt, PROMPT_GUIDE_TEMPLATE } from '~/composables/promptGuide';

describe('buildPrompt', () => {
  it('replaces <KEYWORD> slot with the trimmed keyword', () => {
    const out = buildPrompt('  Car  ');
    expect(out).toContain('KEYWORD: Car');
    expect(out).not.toContain('<KEYWORD>');
  });

  it('replaces <DESC_BLOCK> with DESCRIPTION line when description provided', () => {
    const out = buildPrompt('Car', 'sedan with sunroof');
    expect(out).toContain('DESCRIPTION: sedan with sunroof');
  });

  it('removes <DESC_BLOCK> placeholder when description is empty', () => {
    const out = buildPrompt('Car');
    expect(out).not.toContain('<DESC_BLOCK>');
    expect(out).not.toContain('DESCRIPTION:');
  });

  it('defaults count to 3 when not provided', () => {
    const out = buildPrompt('Car');
    expect(out).not.toContain('<COUNT>');
    expect(out).toMatch(/exactly 3 items/);
  });

  it('uses provided count within 1..8', () => {
    const out = buildPrompt('Car', undefined, 6);
    expect(out).not.toContain('<COUNT>');
    expect(out).toMatch(/exactly 6 items/);
  });

  it('clamps count above 8 down to 8', () => {
    const out = buildPrompt('Car', undefined, 99);
    expect(out).toMatch(/exactly 8 items/);
  });

  it('respects count below default (e.g. 3 from UI)', () => {
    const out = buildPrompt('Car', undefined, 3);
    expect(out).toMatch(/exactly 3 items/);
  });

  it('clamps count below 1 up to 1', () => {
    const out = buildPrompt('Car', undefined, 0);
    expect(out).toMatch(/exactly 1 items/);
  });

  it('clamps non-finite count to default 3', () => {
    const out = buildPrompt('Car', undefined, Number.NaN);
    expect(out).toMatch(/exactly 3 items/);
  });

  it('replaces <COUNT> in all locations (composition + variation sections)', () => {
    const out = buildPrompt('Car', undefined, 6);
    expect(out).not.toContain('<COUNT>');
    // hardcoded "4 items" must not leak through
    expect(out).not.toMatch(/across the 4 items/i);
  });
});

describe('PROMPT_GUIDE_TEMPLATE', () => {
  it('declares { items: [...] } wrapper schema', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"items"');
  });

  it('lists the angle enum for diversity enforcement', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"standard"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"with-action"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"minimal"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"composed"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"in-context"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"with-detail"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"abstract"');
    expect(PROMPT_GUIDE_TEMPLATE).toContain('"scene"');
  });

  it('forbids prose / code fences in output preamble', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/No prose, no code fences/);
  });

  it('mandates persona anatomy for person keywords', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Persona keywords/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/MUST be a person/);
  });

  it('enforces safe-area fill (no miniatures)', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Fill the safe area/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/min-x ≤ 56/);
  });

  it('lists abstract concept vocabulary so variants pick different idioms', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Abstract concept keywords/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/연구 성과/);
  });

  it('ships object-level Anatomy templates (the main detail driver)', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/# Anatomy Density/);
    // density principle applies even without a template match
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/NOT an exhaustive list/);
    // generic fallback examples for non-templated objects
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Car →/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/House →/);
    // a handful of canonical templates must be present
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Person/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Lab Coat/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Beaker/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Microscope/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Phone/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Laptop/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Cloud/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## Speech Bubble/);
  });

  it('ships a Self-Check the LLM runs before output', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/# Self-Check/);
    // anatomy floor enforced via self-check
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/anatomy ≥ 6/);
  });

  it('bumps per-object anatomy floor to 6~10 (not the old 4~7)', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Anatomy parts per object: 6~10/);
    expect(PROMPT_GUIDE_TEMPLATE).not.toMatch(/Anatomy parts per object: 4~7/);
  });

  it('uses stroke-width 6 (matches user-desired reference quality, not 12)', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/stroke-width 6/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/stroke-width="6"/);
    expect(PROMPT_GUIDE_TEMPLATE).not.toMatch(/stroke-width 12\b/);
    expect(PROMPT_GUIDE_TEMPLATE).not.toMatch(/stroke-width="12"/);
  });

  it('forbids fill-opacity (solid dichromatic duotone, not soft-tint)', () => {
    // The instruction must explicitly forbid fill-opacity.
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/DO NOT add fill-opacity/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/fill-opacity .* FORBIDDEN/);
    // And no leftover 0.35 hint remaining from earlier soft-tint era.
    expect(PROMPT_GUIDE_TEMPLATE).not.toMatch(/fill-opacity="0\.35"/);
  });

  it('ships UI-Window / Dashboard composition pattern + anatomy template', () => {
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/UI-Window/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/## UI Window/);
    expect(PROMPT_GUIDE_TEMPLATE).toMatch(/Traffic dots/);
  });
});