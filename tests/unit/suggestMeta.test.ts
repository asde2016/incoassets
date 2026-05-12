import { describe, it, expect } from 'vitest';
import { parseSuggestion } from '~/server/utils/suggestMeta';

describe('parseSuggestion', () => {
  it('정상 JSON (name + category + tags)', () => {
    const r = parseSuggestion(
      '{"name":"신용카드 결제","category":"결제","tags":["payment","credit-card","finance"]}'
    );
    expect(r.name).toBe('신용카드 결제');
    expect(r.category).toBe('결제');
    expect(r.tags).toEqual(['payment', 'credit-card', 'finance']);
  });

  it('code fence 안 JSON 도 추출', () => {
    const text = '```json\n{"name":"클라우드","category":"클라우드","tags":["cloud","data"]}\n```';
    const r = parseSuggestion(text);
    expect(r.name).toBe('클라우드');
    expect(r.category).toBe('클라우드');
    expect(r.tags).toEqual(['cloud', 'data']);
  });

  it('앞뒤 prose 가 섞여도 {...} 만 추출', () => {
    const text = 'Here:\n{"name":"사용자","category":"사용자","tags":["user"]}\nDone.';
    const r = parseSuggestion(text);
    expect(r.name).toBe('사용자');
    expect(r.tags).toEqual(['user']);
  });

  it('태그는 lowercase + 30 자 제한 + 최대 7개, name 은 64 자 제한', () => {
    const text = JSON.stringify({
      name: 'x'.repeat(100),
      category: '데이터',
      tags: ['DATA', 'Cloud', 'this-tag-is-way-too-long-and-must-be-dropped-because-it-exceeds-thirty-chars', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
    });
    const r = parseSuggestion(text);
    expect(r.name.length).toBe(64);
    expect(r.tags).toEqual(['data', 'cloud', 'a', 'b', 'c', 'd', 'e']);
  });

  it('잘못된 JSON → throw', () => {
    expect(() => parseSuggestion('not json at all')).toThrow();
  });

  it('빈 객체 → throw', () => {
    expect(() => parseSuggestion('{}')).toThrow();
  });
});
