import { describe, it, expect } from 'vitest';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';

const SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill-rule="evenodd" ' +
  'data-baseline-stroke-vb="6.50">' +
  '<g class="icon-fill" fill="#2E5BFF"><path d="M0 0L10 10Z"/></g>' +
  '<g class="icon-stroke" fill="#000000" stroke="#000000" stroke-width="0" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="M5 5L15 15Z"/></g>' +
  '</svg>';

describe('applyCustomize', () => {
  it('duotone: icon-fill = base, icon-stroke = darken(base, 0.6) (fill+stroke 양쪽)', () => {
    const c: CustomizeState = { size: 64, strokeWidth: 12, mode: 'duotone', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="64"');
    expect(out).toContain('height="64"');

    // fill 레이어 - base 색
    expect(out).toMatch(/<g[^>]*class="icon-fill"[^>]*fill="#FF0080"|<g[^>]*fill="#FF0080"[^>]*class="icon-fill"/);

    // stroke 레이어 - darken(#FF0080, 0.6): (255×0.4, 0×0.4, 128×0.4) = (102, 0, 51) = #660033
    expect(out).toMatch(/class="icon-stroke"/);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*fill="#660033"|<g[^>]*fill="#660033"[^>]*class="icon-stroke"/);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*stroke="#660033"|<g[^>]*stroke="#660033"[^>]*class="icon-stroke"/);

    // 기존 stroke-linecap·linejoin 등 다른 속성은 보존
    expect(out).toContain('stroke-linecap="round"');
    expect(out).toContain('stroke-linejoin="round"');
  });

  it('linear: icon-fill 그룹 제거, icon-stroke 만 base 단일톤 (fill+stroke 모두)', () => {
    const c: CustomizeState = { size: 48, strokeWidth: 6, mode: 'linear', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).not.toMatch(/class="icon-fill"/);
    expect(out).toMatch(/class="icon-stroke"/);
    // base 색이 fill 과 stroke 양쪽에 모두 적용
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*fill="#FF0080"|<g[^>]*fill="#FF0080"[^>]*class="icon-stroke"/);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*stroke="#FF0080"|<g[^>]*stroke="#FF0080"[^>]*class="icon-stroke"/);
  });

  it('size 만 다르고 색은 동일할 때 width/height 만 변경 + 색 attribute 유지', () => {
    const c: CustomizeState = { size: 100, strokeWidth: 24, mode: 'duotone', color: '#2E5BFF' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toContain('width="100"');
    expect(out).toContain('height="100"');
    expect(out).toContain('fill="#2E5BFF"');
    expect(out).toContain('#122466'); // darken(#2E5BFF, 0.6) = (46×0.4, 91×0.4, 255×0.4) = (18, 36, 102)
  });

  it('strokeWidth 가 icon-stroke 그룹의 stroke-width 속성에 반영 (baseline + N)', () => {
    const c: CustomizeState = { size: 96, strokeWidth: 8, mode: 'duotone', color: '#2E5BFF' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*stroke-width="8"|<g[^>]*stroke-width="8"[^>]*class="icon-stroke"/);
  });

  it('strokeWidth = 0 → baseline 그대로 (stroke-width="0")', () => {
    const c: CustomizeState = { size: 96, strokeWidth: 0, mode: 'duotone', color: '#2E5BFF' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*stroke-width="0"|<g[^>]*stroke-width="0"[^>]*class="icon-stroke"/);
  });

  it('linear 모드에서도 strokeWidth 가 적용됨', () => {
    const c: CustomizeState = { size: 96, strokeWidth: 5, mode: 'linear', color: '#FF0080' };
    const out = applyCustomize(SAMPLE, c);
    expect(out).toMatch(/<g[^>]*class="icon-stroke"[^>]*stroke-width="5"|<g[^>]*stroke-width="5"[^>]*class="icon-stroke"/);
  });
});
