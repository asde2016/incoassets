export type CustomizeState = {
  size: number;
  strokeWidth: number;
  mode: 'default' | 'linear';
  color: string;
};

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;
const STROKE_DARKEN_AMOUNT = 0.45;
const MARKER_MAX_AREA = 800;
const SHAPE_RE = /<(rect|circle|ellipse)\b([^>]*?)(\/?)>/g;

function setOrAddAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}

function readNum(attrs: string, name: string): number {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`, 'i'));
  const raw = m?.[1];
  return raw ? parseFloat(raw) : 0;
}

function shapeArea(tag: string, attrs: string): number {
  if (tag === 'rect') return readNum(attrs, 'width') * readNum(attrs, 'height');
  if (tag === 'circle') {
    const r = readNum(attrs, 'r');
    return Math.PI * r * r;
  }
  if (tag === 'ellipse') {
    return Math.PI * readNum(attrs, 'rx') * readNum(attrs, 'ry');
  }
  return 0;
}

// Mix the given color toward black by `amount` (0..1). Used to derive the
// duotone *line* color from the user-selected *fill* color so the outline sits
// slightly darker than the inner surface.
function darken(color: string, amount: number): string {
  const m = color.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  const raw = m?.[1];
  if (!raw) return color;
  const hex =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const k = 1 - Math.max(0, Math.min(1, amount));
  const channel = (v: number): string =>
    Math.round(v * k)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

type Surface = { match: string; index: number };

// Locate large fill="currentColor" shapes (area > MARKER_MAX_AREA) so linear
// mode can drop their fills while keeping small marker dots opaque.
function findLargeSurfaces(svg: string): Surface[] {
  return Array.from(svg.matchAll(SHAPE_RE))
    .map((m): Surface | null => {
      const tag = m[1];
      const full = m[0];
      const attrs = m[2] ?? '';
      if (!tag || full === undefined || m.index === undefined) return null;
      const fillMatch = attrs.match(/\bfill\s*=\s*"([^"]*)"/i);
      const fillValue = fillMatch?.[1];
      if (!fillValue || fillValue.toLowerCase() !== 'currentcolor') return null;
      const area = shapeArea(tag, attrs);
      if (area <= MARKER_MAX_AREA) return null;
      return { match: full, index: m.index };
    })
    .filter((s): s is Surface => s !== null);
}

export function applyCustomize(svg: string, c: CustomizeState): string {
  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = attrs;
    a = setOrAddAttr(a, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    a = setOrAddAttr(a, 'stroke-width', String(c.strokeWidth));
    return `<svg${a}>`;
  });

  if (c.mode === 'linear') {
    // Outline-only: large surfaces lose their fill, markers stay solid, strokes
    // use the full selected color (line-art look).
    const surfaces = [...findLargeSurfaces(out)].sort((a, b) => b.index - a.index);
    out = surfaces.reduce((acc, s) => {
      const replaced = s.match.replace(/\bfill\s*=\s*"currentColor"/i, 'fill="none"');
      return acc.slice(0, s.index) + replaced + acc.slice(s.index + s.match.length);
    }, out);
    return out.replaceAll('currentColor', c.color);
  }

  // Duotone: fill = full selected color (inner body), stroke = 45% darker line.
  const lineColor = darken(c.color, STROKE_DARKEN_AMOUNT);
  out = out.replace(/\bstroke\s*=\s*"currentColor"/gi, `stroke="${lineColor}"`);
  out = out.replace(/\bfill\s*=\s*"currentColor"/gi, `fill="${c.color}"`);
  // Safety net for any orphan currentColor reference (e.g. on stop-color).
  return out.replaceAll('currentColor', c.color);
}