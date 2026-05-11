import { describe, it, expect } from 'vitest';
import { applyCustomize } from '~/utils/svg/transform';

const baseSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M0 0L512 512"/>' +
  '<path d="M0 512L512 0" fill="currentColor"/>' +
  '</svg>';

// Phone-like icon: outline body (no fill) + screen surface (fill=currentColor, large) + small marker dot (fill=currentColor, small).
const duotoneSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="160" y="40" width="192" height="432" rx="32"/>' +
  '<rect x="180" y="100" width="152" height="320" fill="currentColor"/>' +
  '<circle cx="256" cy="76" r="6" fill="currentColor"/>' +
  '<line x1="232" y1="440" x2="280" y2="440"/>' +
  '</svg>';

describe('applyCustomize', () => {
  it('injects width/height/stroke-width on root', () => {
    const out = applyCustomize(baseSvg, {
      size: 64,
      strokeWidth: 8,
      mode: 'linear',
      color: '#ff0000',
    });
    expect(out).toMatch(/width="64"/);
    expect(out).toMatch(/height="64"/);
    expect(out).toMatch(/stroke-width="8"/);
  });

  it('Linear: surfaces become fill="none", markers stay opaque, stroke uses full color', () => {
    const out = applyCustomize(duotoneSvg, {
      size: 96,
      strokeWidth: 6,
      mode: 'linear',
      color: '#00aa00',
    });
    expect(out).toContain('#00aa00');
    expect(out).not.toContain('currentColor');
    expect(out).not.toContain('fill-opacity');
    // screen surface: fill stripped to none
    expect(out).toMatch(/<rect[^>]*width="152"[^>]*fill="none"/);
    // small marker dot: stays colored opaque (full color, not darkened)
    expect(out).toMatch(/<circle[^>]*r="6"[^>]*fill="#00aa00"\/>/);
    // root stroke: full color in linear mode
    expect(out).toContain('stroke="#00aa00"');
  });

  it('Default duotone: fill = full selected color, stroke = 45% darkened line', () => {
    const out = applyCustomize(duotoneSvg, {
      size: 96,
      strokeWidth: 6,
      mode: 'default',
      color: '#3B82F6',
    });
    // outline body: no fill added
    expect(out).toMatch(/<rect[^>]*width="192"[^>]*height="432"[^>]*rx="32"\/>/);
    expect(out).not.toMatch(/<rect[^>]*width="192"[^>]*height="432"[^>]*fill-opacity/);
    // no fill-opacity injected anywhere in duotone mode
    expect(out).not.toContain('fill-opacity');
    // screen surface: fill = full selected color
    expect(out).toMatch(/<rect[^>]*width="152"[^>]*fill="#3B82F6"\/>/);
    // small marker dot: same full color
    expect(out).toMatch(/<circle[^>]*r="6"[^>]*fill="#3B82F6"\/>/);
    // stroke darkened 45% toward black: #3B82F6 → #204887
    expect(out).toContain('stroke="#204887"');
    expect(out).not.toContain('stroke="currentColor"');
    expect(out).not.toContain('currentColor');
  });

  it('Default duotone outline-only icon: stroke darkened, no fills, no currentColor', () => {
    const outlineSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="40" width="432" height="432"/>' +
      '</svg>';
    const out = applyCustomize(outlineSvg, {
      size: 96,
      strokeWidth: 6,
      mode: 'default',
      color: '#3B82F6',
    });
    expect(out).toContain('stroke="#204887"');
    expect(out).not.toContain('fill-opacity');
    expect(out).not.toContain('currentColor');
  });

  it('Default duotone: 3-digit hex selected color is expanded and darkened', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="40" width="100" height="100" fill="currentColor"/>' +
      '</svg>';
    const out = applyCustomize(svg, {
      size: 96,
      strokeWidth: 6,
      mode: 'default',
      color: '#f00',
    });
    // fill keeps the 3-digit form the user provided
    expect(out).toContain('fill="#f00"');
    // stroke darkening uses expanded value: #ff0000 → #8c0000
    expect(out).toContain('stroke="#8c0000"');
  });

  it('Linear is idempotent', () => {
    const opts = { size: 96, strokeWidth: 6, mode: 'linear', color: '#123456' } as const;
    const a = applyCustomize(baseSvg, opts);
    const b = applyCustomize(a, opts);
    expect(b).toBe(a);
  });

  it('Default duotone is idempotent', () => {
    const opts = { size: 96, strokeWidth: 6, mode: 'default', color: '#3B82F6' } as const;
    const a = applyCustomize(duotoneSvg, opts);
    const b = applyCustomize(a, opts);
    expect(b).toBe(a);
  });
});