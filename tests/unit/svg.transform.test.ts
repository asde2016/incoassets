import { describe, it, expect } from 'vitest';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';

const SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill-rule="evenodd">' +
  '<g data-layer="fill" fill="#256BFA"><path d="M0 0L10 10Z"/></g>' +
  '<g data-layer="stroke" fill="#164096"><path d="M5 5L15 15Z"/></g>' +
  '</svg>';

describe('applyCustomize', () => {
  it('duotone: fill layer = base, stroke layer = darken(base, 0.4)', () => {
    const c: CustomizeState = { size: 64, strokeWidth: 12, mode: 'duotone', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="64"');
    expect(out).toContain('height="64"');

    // fill layer
    expect(out).toMatch(
      /<g\b[^>]*data-layer="fill"[^>]*fill="#FF0080"|<g\b[^>]*fill="#FF0080"[^>]*data-layer="fill"/
    );

    // stroke layer 도 fill 속성 — darken(#FF0080, 0.4) = (153, 0, 77) = #99004D
    expect(out).toMatch(
      /<g\b[^>]*data-layer="stroke"[^>]*fill="#99004D"|<g\b[^>]*fill="#99004D"[^>]*data-layer="stroke"/
    );
  });

  it('linear: fill 그룹 제거, stroke layer 는 base 색으로 단일톤', () => {
    const c: CustomizeState = { size: 48, strokeWidth: 6, mode: 'linear', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).not.toMatch(/data-layer="fill"/);
    expect(out).toMatch(/data-layer="stroke"/);
    expect(out).toContain('fill="#FF0080"');
  });

  it('size 만 다르고 색은 동일할 때 width/height 만 변경', () => {
    const c: CustomizeState = { size: 100, strokeWidth: 24, mode: 'duotone', color: '#256BFA' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="100"');
    expect(out).toContain('height="100"');
    expect(out).toContain('fill="#256BFA"');
    expect(out).toContain('fill="#164096"'); // darken(#256BFA, 0.4)
  });
});
