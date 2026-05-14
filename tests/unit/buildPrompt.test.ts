import { describe, it, expect } from 'vitest';
import { buildPrompt } from '~/server/utils/buildPrompt';

describe('buildPrompt', () => {
  it('keyword 만 → 키워드 치환, Concept 블록 없음, placeholder 잔존 없음', () => {
    const { prompt } = buildPrompt({ keyword: 'credit card' });
    expect(prompt).toContain('Create a flat, minimalist duotone icon of credit card,');
    expect(prompt).toContain('#2E5BFF');
    expect(prompt).toContain('#000000');
    expect(prompt).toContain('#FFFFFF');
    expect(prompt).not.toContain('Concept');
    expect(prompt).not.toMatch(/\{[a-z_]+\}/);
  });

  it('description 제공 → 본문 뒤에 description 삽입, Concept 없음', () => {
    const { prompt } = buildPrompt({
      keyword: 'cloud',
      description: 'with upload arrow',
    });
    expect(prompt).toContain('with upload arrow');
    expect(prompt).not.toContain('Concept');
  });

  it('keyword 가 비어있으면 throw', () => {
    expect(() => buildPrompt({ keyword: '   ' })).toThrow();
  });
});