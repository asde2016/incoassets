import { describe, it, expect } from 'vitest';
import { validateMeta, makeSlug } from '~/utils/svg/meta';

describe('validateMeta', () => {
  it('name 필수', () => {
    const r = validateMeta({ name: '' });
    expect(r.ok).toBe(false);
  });
  it('정상 입력 → 정규화된 meta', () => {
    const r = validateMeta({
      name: '  Credit Card  ',
      tags: ['Pay', 'pay', 'finance'],
      category: 'Finance',
      description: 'a card',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.meta.name).toBe('Credit Card');
      expect(r.meta.tags).toEqual(['pay', 'finance']);
      expect(r.meta.category).toBe('Finance');
      expect(r.meta.description).toBe('a card');
    }
  });
  it('name 길이 64 초과 → 에러', () => {
    const r = validateMeta({ name: 'a'.repeat(65) });
    expect(r.ok).toBe(false);
  });
});

describe('makeSlug', () => {
  it('소문자 + 영숫자만 + 하이픈', () => {
    expect(makeSlug('Credit Card Icon')).toBe('credit-card-icon');
  });
  it('특수문자 / 한글 모두 → fallback', () => {
    expect(makeSlug('???한글???')).toMatch(/^icon-[a-z0-9]{6}$/);
  });
  it('32 자 초과 → 하이픈 경계에서 절단 (단어 중간 안 자름)', () => {
    const slug = makeSlug('this-is-a-very-detailed-credit-card-payment-processing-icon');
    expect(slug.length).toBeLessThanOrEqual(32);
    expect(slug.endsWith('-')).toBe(false);
    // 절단 후에도 유효한 kebab — 사후 어휘 일부가 남아 있어야 함
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('하이픈이 너무 늦게 나오면 단순 절단 (마지막 하이픈만 제거)', () => {
    const slug = makeSlug('thisisaverylongunbrokenkebabnamethatwontfit');
    expect(slug.length).toBeLessThanOrEqual(32);
    expect(slug.endsWith('-')).toBe(false);
  });
  it('maxLen 인자로 길이 한도 조절', () => {
    expect(makeSlug('credit-card-payment-system', 16)).toBe('credit-card');
  });
});
