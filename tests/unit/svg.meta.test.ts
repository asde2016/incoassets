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
});
