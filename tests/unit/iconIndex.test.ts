import { describe, it, expect } from 'vitest';
import { searchIcons } from '~/server/utils/iconIndex';

describe('iconIndex.searchIcons', () => {
  it('returns empty array for empty query', () => {
    expect(searchIcons('')).toEqual([]);
    expect(searchIcons('   ')).toEqual([]);
  });

  it('finds phone-related icons across sets', () => {
    const results = searchIcons('phone', 10);
    expect(results.length).toBeGreaterThan(0);
    // multiple sets should be represented in a common keyword
    const sets = new Set(results.map((r) => r.set));
    expect(sets.size).toBeGreaterThan(1);
    // exact-name match should rank near the top
    expect(results.slice(0, 3).some((r) => r.name === 'phone')).toBe(true);
  });

  it('wraps icons in a customizable SVG (currentColor stroke, no per-path stroke-width)', () => {
    const [r] = searchIcons('cloud', 1);
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.svg.startsWith('<svg')).toBe(true);
    expect(r.svg).toContain('stroke="currentColor"');
    expect(r.svg).toContain('fill="none"');
    expect(r.svg).toMatch(/stroke-width="\d+(?:\.\d+)?"/);
    // body content should NOT carry per-path stroke-width (we strip during build)
    expect(r.svg).not.toMatch(/<path[^>]*\sstroke-width=/);
  });

  it('supports filtering by set', () => {
    const lucideOnly = searchIcons('house', 20, 'lucide');
    expect(lucideOnly.length).toBeGreaterThan(0);
    expect(lucideOnly.every((r) => r.set === 'lucide')).toBe(true);
  });

  it('respects limit', () => {
    const results = searchIcons('arrow', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('handles multi-token queries (cloud server, code review)', () => {
    const r = searchIcons('cloud server', 10);
    expect(r.length).toBeGreaterThan(0);
    // top match should include both tokens somehow
    const top = r[0]!.name.toLowerCase();
    expect(top.includes('cloud') || top.includes('server')).toBe(true);
  });
});