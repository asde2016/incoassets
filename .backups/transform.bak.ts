export type CustomizeState = {
  size: number;
  strokeWidth: number;
  mode: 'default' | 'linear';
  color: string;
};

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;
const SURFACE_FILL_OPACITY = 0.4;
const MARKER_MAX_AREA = 800;
const SHAPE_RE = /<(rect|circle|ellipse)\b([^>]*?)(\/?)>/g;

function setOrAddAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}

function readNum(attrs: string, name: string): number {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`, 'i'));
  return m && m[1] ? parseFloat(m[1]) : 0;
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

type Surface = { match: string; index: number };

// LLM이 fill="currentColor"로 marking한 큰 면적 shape를 찾는다 (small markers는 opaque로 둔다).
function findSurfaces(svg: string): Surface[] {
  const out: Surface[] = [];
  const re = new RegExp(SHAPE_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const attrs = m[2] ?? '';
    const fillMatch = attrs.match(/\bfill\s*=\s*"([^"]*)"/i);
    if (!fillMatch || fillMatch[1].toLowerCase() !== 'currentcolor') continue;
    if (/\bfill-opacity\s*=/i.test(attrs)) continue;
    const area = shapeArea(m[1] ?? '', attrs);
    if (area <= MARKER_MAX_AREA) continue;
    out.push({ match: m[0], index: m.index });
  }
  return out;
}

function addFillOpacity(tag: string, alpha: number): string {
  return tag.replace(/(\/?>)$/, ` fill-opacity="${alpha}"$1`);
}

export function applyCustomize(svg: string, c: CustomizeState): string {
  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = attrs;
    a = setOrAddAttr(a, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    a = setOrAddAttr(a, 'stroke-width', String(c.strokeWidth));
    return `<svg${a}>`;
  });

  const surfaces = findSurfaces(out).sort((a, b) => b.index - a.index);
  for (const s of surfaces) {
    const replaced =
      c.mode === 'linear'
        ? s.match.replace(/\bfill\s*=\s*"currentColor"/i, 'fill="none"')
        : addFillOpacity(s.match, SURFACE_FILL_OPACITY);
    out = out.slice(0, s.index) + replaced + out.slice(s.index + s.match.length);
  }

  return out.replace(/currentColor/g, c.color);
}
