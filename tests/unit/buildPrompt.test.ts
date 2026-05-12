import { describe, it, expect } from 'vitest';
import { buildPrompt } from '~/server/utils/buildPrompt';

describe('buildPrompt', () => {
  it('keyword / base_hex / stroke_hex / background_hex / description 모두 치환', () => {
    const { prompt, backgroundHex } = buildPrompt({
      keyword: 'credit card',
      baseHex: '#256BFA',
      description: 'with a hand pressing it',
    });
    expect(prompt).toContain('Create a flat, minimalist duotone icon of credit card.');
    expect(prompt).toContain('Color: #164096   (each RGB channel of #256BFA');
    expect(prompt).toContain('Color: #256BFA');
    expect(prompt).toContain('with a hand pressing it');

    // base_hex 두 번 이상 등장 + 치환됨
    expect((prompt.match(/#256BFA/g) ?? []).length).toBeGreaterThanOrEqual(2);

    // background_hex 도 여러 군데 등장 + 치환됨
    expect(backgroundHex).toBe('#FFFFFF'); // 어두운 파랑 → 흰 배경
    expect((prompt.match(/#FFFFFF/g) ?? []).length).toBeGreaterThanOrEqual(3);

    // placeholder 0
    expect(prompt).not.toMatch(/\{[a-z_]+\}/);
  });

  it('밝은 base 색 → 검정 배경 (luminance > 200)', () => {
    const { prompt, backgroundHex } = buildPrompt({ keyword: 'sun', baseHex: '#FFFF00' });
    expect(backgroundHex).toBe('#000000');
    expect(prompt).toContain('solid pure #000000');
    expect(prompt).not.toMatch(/\{background_hex\}/);
  });

  it('description 미지정 → 그 자리에 빈 줄, placeholder 잔존 없음', () => {
    const { prompt } = buildPrompt({ keyword: 'cloud', baseHex: '#FF0080' });
    expect(prompt).not.toMatch(/\{description\}/);
    // 본문 마지막이 "identical to the background" 줄 (description 자리가 빈 줄)
    expect(prompt.trimEnd().endsWith('identical to the background')).toBe(true);
  });

  it('잘못된 hex → throw', () => {
    expect(() => buildPrompt({ keyword: 'x', baseHex: '#GGG' })).toThrow();
  });
});
