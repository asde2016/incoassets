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

  it('description 만 → 본문 뒤에 description 삽입, Concept 없음', () => {
    const { prompt } = buildPrompt({
      keyword: 'cloud',
      description: 'with upload arrow',
    });
    expect(prompt).toContain('with upload arrow');
    expect(prompt).not.toContain('Concept');
  });

  it('bilingual name → "ko (en)" 형식으로 Concept 표기', () => {
    const { prompt } = buildPrompt({
      keyword: 'credit card',
      name: { ko: '신용카드 결제', en: 'credit-card-payment' },
    });
    expect(prompt).toContain('Concept');
    expect(prompt).toContain('- name: 신용카드 결제 (credit-card-payment)');
  });

  it('bilingual category → "ko (en)" 형식', () => {
    const { prompt } = buildPrompt({
      keyword: 'x',
      category: { ko: '결제', en: 'payment' },
    });
    expect(prompt).toContain('- category: 결제 (payment)');
  });

  it('한쪽만 있을 때 → 그 값만 표기 (괄호 없음)', () => {
    const { prompt } = buildPrompt({
      keyword: 'x',
      name: { ko: '신용카드', en: '' },
      category: { ko: '', en: 'payment' },
    });
    expect(prompt).toContain('- name: 신용카드');
    expect(prompt).not.toContain('- name: 신용카드 (');
    expect(prompt).toContain('- category: payment');
  });

  it('tags 는 ko + en 을 한 줄로 합쳐 표기', () => {
    const { prompt } = buildPrompt({
      keyword: 'x',
      tags: {
        ko: ['결제', '신용카드'],
        en: ['payment', 'credit-card', 'finance'],
      },
    });
    expect(prompt).toContain('- tags: 결제, 신용카드, payment, credit-card, finance');
  });

  it('Concept + description 모두 있으면 Concept 가 먼저, description 이 뒤', () => {
    const { prompt } = buildPrompt({
      keyword: 'cloud',
      description: 'with upload arrow',
      name: { ko: '데이터 업로드', en: 'data-upload' },
      category: { ko: '데이터', en: 'data' },
      tags: { ko: ['업로드'], en: ['upload', 'cloud'] },
    });
    const conceptIdx = prompt.indexOf('Concept');
    const descIdx = prompt.indexOf('with upload arrow');
    expect(conceptIdx).toBeGreaterThan(0);
    expect(descIdx).toBeGreaterThan(conceptIdx);
  });

  it('keyword 가 비어있으면 throw', () => {
    expect(() => buildPrompt({ keyword: '   ' })).toThrow();
  });
});
