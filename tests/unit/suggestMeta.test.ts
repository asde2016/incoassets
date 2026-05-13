import { describe, it, expect } from 'vitest';
import { parseSuggestion, toKebab } from '~/server/utils/suggestMeta';

describe('parseSuggestion (bilingual)', () => {
  it('정상 bilingual JSON', () => {
    const r = parseSuggestion(
      JSON.stringify({
        name: { ko: '신용카드 결제', en: 'credit-card-payment' },
        category: { ko: '결제', en: 'payment' },
        tags: {
          ko: ['결제', '신용카드', '금융'],
          en: ['payment', 'credit-card', 'finance'],
        },
      })
    );
    expect(r.name).toEqual({ ko: '신용카드 결제', en: 'credit-card-payment' });
    expect(r.category).toEqual({ ko: '결제', en: 'payment' });
    expect(r.tags.ko).toEqual(['결제', '신용카드', '금융']);
    expect(r.tags.en).toEqual(['payment', 'credit-card', 'finance']);
  });

  it('name.en 이 비-kebab 으로 와도 정규화', () => {
    const r = parseSuggestion(
      JSON.stringify({
        name: { ko: '신용카드', en: 'Credit Card Payment!' },
        category: { ko: '결제', en: 'PAYMENT' },
        tags: { ko: [], en: ['payment'] },
      })
    );
    expect(r.name.en).toBe('credit-card-payment');
    // category.en 은 kebab 강제 아님 — 단순 lowercase
    expect(r.category.en).toBe('payment');
  });

  it('name.en 은 파일명으로 들어가므로 32 자로 cap + 하이픈 경계 절단', () => {
    const r = parseSuggestion(
      JSON.stringify({
        name: {
          ko: '신용카드',
          en: 'a-very-long-detailed-credit-card-payment-system-icon',
        },
        category: { ko: '결제', en: 'payment' },
        tags: { ko: [], en: ['payment'] },
      })
    );
    expect(r.name.en.length).toBeLessThanOrEqual(32);
    // 단어 중간 절단 안 함 — 항상 완결된 kebab 형태
    expect(r.name.en.endsWith('-')).toBe(false);
    expect(r.name.en).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('code fence 안 JSON 도 추출', () => {
    const inner = JSON.stringify({
      name: { ko: '클라우드', en: 'cloud' },
      category: { ko: '클라우드', en: 'cloud' },
      tags: { ko: ['클라우드'], en: ['cloud', 'data'] },
    });
    const r = parseSuggestion(`\`\`\`json\n${inner}\n\`\`\``);
    expect(r.name).toEqual({ ko: '클라우드', en: 'cloud' });
    expect(r.tags.en).toEqual(['cloud', 'data']);
  });

  it('앞뒤 prose 가 섞여도 {...} 만 추출', () => {
    const inner = JSON.stringify({
      name: { ko: '사용자', en: 'user' },
      category: { ko: '사용자', en: 'user' },
      tags: { ko: ['사용자'], en: ['user'] },
    });
    const r = parseSuggestion(`Here:\n${inner}\nDone.`);
    expect(r.name.ko).toBe('사용자');
    expect(r.tags.en).toEqual(['user']);
  });

  it('태그 lowercase + 30 자 제한 + 언어당 최대 5개', () => {
    const r = parseSuggestion(
      JSON.stringify({
        name: { ko: 'x'.repeat(100), en: 'x' },
        category: { ko: '데이터', en: 'data' },
        tags: {
          ko: ['데이터', '저장'],
          en: [
            'DATA',
            'Cloud',
            'this-tag-is-way-too-long-and-must-be-dropped-because-it-exceeds-thirty-chars',
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
          ],
        },
      })
    );
    expect(r.name.ko.length).toBe(32);
    // 30자 초과 1개 drop → 9개 남음 → slice(0, 5) → 첫 5개
    expect(r.tags.en).toEqual(['data', 'cloud', 'a', 'b', 'c']);
    // Korean 은 case 없음 — 변환 무영향
    expect(r.tags.ko).toEqual(['데이터', '저장']);
  });

  it('잘못된 JSON → throw', () => {
    expect(() => parseSuggestion('not json at all')).toThrow();
  });

  it('빈 객체 → throw', () => {
    expect(() => parseSuggestion('{}')).toThrow();
  });
});

describe('toKebab', () => {
  it('공백/특수문자 → 하이픈, 양끝 하이픈 제거', () => {
    expect(toKebab('Credit Card Payment!')).toBe('credit-card-payment');
    expect(toKebab('  --foo--bar--  ')).toBe('foo-bar');
    expect(toKebab('database')).toBe('database');
    expect(toKebab('데이터베이스')).toBe('');
  });
});
