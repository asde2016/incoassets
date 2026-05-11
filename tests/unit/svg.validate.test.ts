import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseUploadInput,
  parseUploadList,
  validateAndNormalizeSvg,
  validateMeta,
  makeSlug,
  extractBBox,
  countShapes,
  countFills,
} from '~/utils/svg/validate';

describe('parseUploadInput', () => {
  it('strips ```json code fences', () => {
    const input = '```json\n{"name":"X","tags":["a"],"category":"c","svg":"<svg/>"}\n```';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('<svg/>');
    expect(r.meta?.name).toBe('X');
    expect(r.meta?.tags).toEqual(['a']);
    expect(r.meta?.category).toBe('c');
  });

  it('parses bare JSON payload', () => {
    const input = '{"name":"Y","tags":["b"],"category":"d","svg":"<svg/>"}';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('<svg/>');
    expect(r.meta?.name).toBe('Y');
  });

  it('extracts <svg>...</svg> when input is not JSON', () => {
    const input =
      'Sure, here is your icon:\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"></svg>\nLet me know if...';
    const r = parseUploadInput(input);
    expect(r.svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(r.meta).toBeNull();
  });

  it('returns trimmed input as svg when no <svg> tag matched and no JSON', () => {
    const input = '   not really svg   ';
    const r = parseUploadInput(input);
    expect(r.svg).toBe('not really svg');
    expect(r.meta).toBeNull();
  });
});

const fix = (rel: string) => readFileSync(resolve(__dirname, '..', 'fixtures', 'svg', rel), 'utf8');

describe('validateAndNormalizeSvg', () => {
  it('accepts a valid Feather-style svg and emits canonical root attrs', () => {
    const r = validateAndNormalizeSvg(fix('valid/cloud.svg'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(r.svg).toContain('viewBox="0 0 512 512"');
      expect(r.svg).toContain('stroke="currentColor"');
      expect(r.svg).toContain('stroke-linecap="round"');
      expect(r.svg).toContain('stroke-linejoin="round"');
      expect(r.svg).toContain('<path');
    }
  });

  it('rejects when viewBox is not "0 0 512 512"', () => {
    const r = validateAndNormalizeSvg(fix('invalid/wrong-viewbox.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some(e => e.toLowerCase().includes('viewbox'))).toBe(true);
  });

  it('rejects hex color in fill/stroke', () => {
    const r = validateAndNormalizeSvg(fix('invalid/bad-color.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some(e => e.toLowerCase().includes('color'))).toBe(true);
  });

  it('rejects forbidden nodes (<linearGradient>)', () => {
    const r = validateAndNormalizeSvg(fix('invalid/forbidden-node.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/forbidden|lineargradient/i);
  });

  it('rejects <script>', () => {
    const r = validateAndNormalizeSvg(fix('invalid/inline-script.svg'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/script/i);
  });

  it('rejects payload over 50KB', () => {
    const big =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor"><path d="' +
      'M'.repeat(60_000) +
      '"/></svg>';
    const r = validateAndNormalizeSvg(big);
    expect(r.ok).toBe(false);
  });

  it('preserves <g> with safe transform, drops other g attrs', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor"><g transform="translate(80 100) scale(8)" data-foo="bar"><path d="M0 0L24 24"/></g></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // <g transform="..."> survives, attribute whitelisted to `transform` only.
      expect(r.svg).toContain('<g transform="translate(80 100) scale(8)"');
      expect(r.svg).not.toContain('data-foo');
      expect(r.svg).toContain('<path d="M0 0L24 24"');
    }
  });

  it('drops bare <g> wrapper (no transform) but keeps children', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor"><g><path d="M0 0L512 512"/></g></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // wrapper has no useful attribute but still emits as <g> since the structure is preserved;
      // the inner shape must remain.
      expect(r.svg).toContain('<path');
    }
  });

  it('rejects <g> with unsafe transform value (e.g. arbitrary text)', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor"><g transform="javascript:alert(1)"><path d="M0 0L512 512"/></g></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join(' ')).toMatch(/Unsafe transform/);
    }
  });

  it('strips on* event handlers (rejects)', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor"><path d="M0 0" onclick="x()"/></svg>';
    const r = validateAndNormalizeSvg(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ').toLowerCase()).toContain('onclick');
  });

  it('rejects empty input', () => {
    const r = validateAndNormalizeSvg('   ');
    expect(r.ok).toBe(false);
  });

  it('warns when bbox span on x axis is below 400', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="200" y="40" width="100" height="432"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('x axis'))).toBe(true);
    }
  });

  it('warns when bbox span on y axis is below 400', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="200" width="432" height="100"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('y axis'))).toBe(true);
    }
  });

  it('warns when shape count is outside 14..24', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">' +
      '<rect x="40" y="40" width="432" height="432"/></svg>';
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('Shape count'))).toBe(true);
    }
  });

  it('warns when fill="currentColor" count is below 3', () => {
    const shapes = Array.from({ length: 14 }, (_, i) =>
      `<rect x="${40 + i * 4}" y="40" width="20" height="432"/>`,
    ).join('');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">${shapes}</svg>`;
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some(w => w.includes('filled regions'))).toBe(true);
    }
  });

  it('emits empty warnings array for a well-formed icon (>=14 shapes, full bbox, >=3 fills)', () => {
    const shapes: string[] = [];
    for (let i = 0; i < 14; i++) {
      const fill = i < 3 ? ' fill="currentColor"' : '';
      shapes.push(`<rect x="${40 + i * 30}" y="40" width="20" height="432"${fill}/>`);
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="6">${shapes.join('')}</svg>`;
    const r = validateAndNormalizeSvg(svg);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings).toEqual([]);
    }
  });
});

describe('validateMeta', () => {
  it('accepts valid meta', () => {
    const r = validateMeta({ name: 'AWS Cloud', tags: ['aws', 'cloud'], category: 'cloud' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.meta.name).toBe('AWS Cloud');
      expect(r.meta.tags).toEqual(['aws', 'cloud']);
      expect(r.meta.category).toBe('cloud');
    }
  });

  it('rejects empty name', () => {
    const r = validateMeta({ name: '   ', tags: [], category: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects name longer than 64 chars', () => {
    const r = validateMeta({ name: 'a'.repeat(65), tags: [], category: '' });
    expect(r.ok).toBe(false);
  });

  it('lowercases tags and dedupes', () => {
    const r = validateMeta({ name: 'X', tags: ['AWS', 'aws', 'Cloud'], category: '' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.meta.tags).toEqual(['aws', 'cloud']);
  });

  it('rejects too many tags', () => {
    const r = validateMeta({
      name: 'X',
      tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
      category: '',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects category over 30 chars', () => {
    const r = validateMeta({ name: 'X', tags: [], category: 'a'.repeat(31) });
    expect(r.ok).toBe(false);
  });
});

describe('makeSlug', () => {
  it('lowercases and hyphens basic ascii', () => {
    expect(makeSlug('AWS Cloud Storage')).toBe('aws-cloud-storage');
  });

  it('strips disallowed chars', () => {
    expect(makeSlug('Hello, World!')).toBe('hello-world');
  });

  it('falls back to icon-<nanoid> for korean-only name', () => {
    const s = makeSlug('한국어 이름');
    expect(s).toMatch(/^icon-[a-z0-9_-]{6}$/i);
  });

  it('collapses consecutive hyphens', () => {
    expect(makeSlug('foo --- bar')).toBe('foo-bar');
  });
});

describe('parseUploadList', () => {
  it('returns [] for empty input', () => {
    expect(parseUploadList('')).toEqual([]);
    expect(parseUploadList('   \n\t  ')).toEqual([]);
  });

  it('parses { items: [...] } wrapper with multiple items', () => {
    const input = JSON.stringify({
      items: [
        {
          name: 'Car',
          tags: ['vehicle'],
          category: 'transport',
          angle: 'standard',
          svg: '<svg id="a"/>',
        },
        {
          name: 'Car',
          tags: ['vehicle', 'minimal'],
          category: 'transport',
          angle: 'minimal',
          svg: '<svg id="b"/>',
        },
      ],
    });
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].svg).toBe('<svg id="a"/>');
    expect(r[0].meta?.name).toBe('Car');
    expect(r[0].meta?.tags).toEqual(['vehicle']);
    expect(r[1].svg).toBe('<svg id="b"/>');
    expect(r[1].meta?.tags).toEqual(['vehicle', 'minimal']);
  });

  it('parses raw top-level array', () => {
    const input = JSON.stringify([
      { name: 'A', svg: '<svg id="a"/>' },
      { name: 'B', svg: '<svg id="b"/>' },
    ]);
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].meta?.name).toBe('A');
    expect(r[1].meta?.name).toBe('B');
  });

  it('parses single legacy { name, svg, ... } object as 1-item array', () => {
    const input = '{"name":"X","tags":["a"],"category":"c","svg":"<svg/>"}';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toBe('<svg/>');
    expect(r[0].meta?.name).toBe('X');
    expect(r[0].meta?.tags).toEqual(['a']);
  });

  it('strips ```json code fences before parsing', () => {
    const input = '```json\n{"items":[{"svg":"<svg/>","name":"X"}]}\n```';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toBe('<svg/>');
    expect(r[0].meta?.name).toBe('X');
  });

  it('extracts multiple <svg>...</svg> when input is not JSON', () => {
    const input = 'Sure!\n<svg id="x"></svg>\nand also\n<svg id="y"></svg>\nthank you';
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].svg).toMatch(/id="x"/);
    expect(r[0].meta).toBeNull();
    expect(r[1].svg).toMatch(/id="y"/);
    expect(r[1].meta).toBeNull();
  });

  it('extracts single <svg>...</svg> when input is loose prose', () => {
    const input = 'here is your icon: <svg id="only"></svg>';
    const r = parseUploadList(input);
    expect(r).toHaveLength(1);
    expect(r[0].svg).toMatch(/id="only"/);
    expect(r[0].meta).toBeNull();
  });

  it('returns [] when JSON parses but has no svg field', () => {
    const r = parseUploadList('{"foo":"bar"}');
    expect(r).toEqual([]);
  });

  it('skips items without a string svg field in items array', () => {
    const input = JSON.stringify({
      items: [
        { name: 'A', svg: '<svg id="a"/>' },
        { name: 'B' }, // no svg
        { name: 'C', svg: 123 }, // wrong type
        { name: 'D', svg: '<svg id="d"/>' },
      ],
    });
    const r = parseUploadList(input);
    expect(r).toHaveLength(2);
    expect(r[0].meta?.name).toBe('A');
    expect(r[1].meta?.name).toBe('D');
  });

  it('returns [] when items array is empty', () => {
    expect(parseUploadList('{"items":[]}')).toEqual([]);
  });
});

describe('extractBBox', () => {
  it('returns null for empty svg', () => {
    expect(extractBBox('<svg></svg>')).toBeNull();
  });

  it('captures rect bounds (x..x+width, y..y+height)', () => {
    const svg = '<svg><rect x="40" y="80" width="432" height="352"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 472, minY: 80, maxY: 432 });
  });

  it('captures circle bounds (cx±r, cy±r)', () => {
    const svg = '<svg><circle cx="256" cy="256" r="100"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 156, maxX: 356, minY: 156, maxY: 356 });
  });

  it('captures ellipse bounds (cx±rx, cy±ry)', () => {
    const svg = '<svg><ellipse cx="200" cy="300" rx="50" ry="80"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 150, maxX: 250, minY: 220, maxY: 380 });
  });

  it('captures line endpoints', () => {
    const svg = '<svg><line x1="10" y1="20" x2="100" y2="200"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 10, maxX: 100, minY: 20, maxY: 200 });
  });

  it('captures polygon/polyline points', () => {
    const svg = '<svg><polygon points="100,50 200,150 50,250"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 50, maxX: 200, minY: 50, maxY: 250 });
  });

  it('captures absolute path M/L coords', () => {
    const svg = '<svg><path d="M 40 40 L 472 472"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 472, minY: 40, maxY: 472 });
  });

  it('unions multiple shapes', () => {
    const svg = '<svg><rect x="40" y="40" width="40" height="40"/><circle cx="400" cy="400" r="50"/></svg>';
    expect(extractBBox(svg)).toEqual({ minX: 40, maxX: 450, minY: 40, maxY: 450 });
  });
});

describe('countShapes', () => {
  it('returns 0 for svg with no primitive children', () => {
    expect(countShapes('<svg></svg>')).toBe(0);
  });

  it('counts each rect/circle/line/path occurrence', () => {
    const svg = '<svg><rect/><rect/><circle/><line/><path/><polygon/><polyline/><ellipse/></svg>';
    expect(countShapes(svg)).toBe(8);
  });

  it('ignores nested <g> wrappers but counts their contents', () => {
    const svg = '<svg><g><rect/><circle/></g><line/></svg>';
    expect(countShapes(svg)).toBe(3);
  });
});

describe('countFills', () => {
  it('counts shapes with fill="currentColor"', () => {
    const svg =
      '<svg><rect fill="currentColor"/><circle fill="none"/><path fill="currentColor"/></svg>';
    expect(countFills(svg)).toBe(2);
  });

  it('returns 0 when no shape has currentColor fill', () => {
    expect(countFills('<svg><rect/><circle fill="none"/></svg>')).toBe(0);
  });

  it('does not count currentColor on stroke', () => {
    expect(countFills('<svg><rect stroke="currentColor"/></svg>')).toBe(0);
  });
});
