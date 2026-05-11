import { XMLParser } from 'fast-xml-parser';
import { customAlphabet } from 'nanoid';

export type IconMeta = {
  name: string;
  tags: string[];
  category: string;
  description: string;
};
export type ParsedItem = { svg: string; meta: Partial<IconMeta> | null };
export type ParsedUpload = ParsedItem;

const CODE_FENCE_RE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
const SVG_RE = /<svg[\s\S]*?<\/svg>/i;

const SVG_GLOBAL_RE = /<svg[\s\S]*?<\/svg>/gi;

function extractItem(j: unknown): ParsedItem | null {
  if (!j || typeof j !== 'object' || typeof (j as { svg?: unknown }).svg !== 'string') {
    return null;
  }
  const obj = j as Record<string, unknown>;
  const meta: Partial<IconMeta> = {};
  if (typeof obj.name === 'string') meta.name = obj.name;
  if (Array.isArray(obj.tags)) {
    meta.tags = obj.tags.filter((t: unknown): t is string => typeof t === 'string');
  }
  if (typeof obj.category === 'string') meta.category = obj.category;
  if (typeof obj.description === 'string') meta.description = obj.description;
  return { svg: obj.svg as string, meta };
}

export function parseUploadInput(raw: string): ParsedUpload {
  let s = raw.trim();
  const fenceMatch = s.match(CODE_FENCE_RE);
  if (fenceMatch) s = fenceMatch[1].trim();

  if (s.startsWith('{')) {
    try {
      const j = JSON.parse(s);
      if (j && typeof j === 'object' && typeof j.svg === 'string') {
        return {
          svg: j.svg,
          meta: {
            name: typeof j.name === 'string' ? j.name : undefined,
            tags: Array.isArray(j.tags)
              ? j.tags.filter((t: unknown): t is string => typeof t === 'string')
              : undefined,
            category: typeof j.category === 'string' ? j.category : undefined,
            description: typeof j.description === 'string' ? j.description : undefined,
          },
        };
      }
    } catch {
      /* fallthrough */
    }
  }

  const svgMatch = s.match(SVG_RE);
  return { svg: svgMatch ? svgMatch[0] : s, meta: null };
}

export function parseUploadList(raw: string): ParsedItem[] {
  let s = raw.trim();
  if (s.length === 0) return [];

  const fenceMatch = s.match(CODE_FENCE_RE);
  if (fenceMatch) s = fenceMatch[1].trim();

  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const j = JSON.parse(s);
      if (
        j &&
        typeof j === 'object' &&
        !Array.isArray(j) &&
        Array.isArray((j as { items?: unknown }).items)
      ) {
        return (j as { items: unknown[] }).items
          .map(it => extractItem(it))
          .filter((x): x is ParsedItem => x !== null);
      }
      if (Array.isArray(j)) {
        return j.map(it => extractItem(it)).filter((x): x is ParsedItem => x !== null);
      }
      const single = extractItem(j);
      if (single) return [single];
    } catch {
      /* fall through to raw <svg> matching */
    }
  }

  const matches = s.match(SVG_GLOBAL_RE);
  if (matches && matches.length > 0) {
    return matches.map(m => ({ svg: m, meta: null }));
  }

  return [];
}

export type ValidationResult =
  | { ok: true; svg: string; warnings: string[] }
  | { ok: false; errors: string[] };

export type BBox = { minX: number; maxX: number; minY: number; maxY: number };

const NUM = '(-?[0-9]+(?:\\.[0-9]+)?)';

function num(s: string | undefined): number | null {
  if (s == null) return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

function unionPoint(bb: BBox | null, x: number, y: number): BBox {
  if (!bb) return { minX: x, maxX: x, minY: y, maxY: y };
  return {
    minX: Math.min(bb.minX, x),
    maxX: Math.max(bb.maxX, x),
    minY: Math.min(bb.minY, y),
    maxY: Math.max(bb.maxY, y),
  };
}

function unionRange(bb: BBox | null, x1: number, x2: number, y1: number, y2: number): BBox {
  let b = unionPoint(bb, x1, y1);
  b = unionPoint(b, x2, y2);
  return b;
}

export function extractBBox(svg: string): BBox | null {
  let bb: BBox | null = null;

  const rectRe = new RegExp(
    `<rect\\b[^>]*?\\bx="${NUM}"[^>]*?\\by="${NUM}"[^>]*?\\bwidth="${NUM}"[^>]*?\\bheight="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(rectRe)) {
    const x = num(m[1]); const y = num(m[2]); const w = num(m[3]); const h = num(m[4]);
    if (x == null || y == null || w == null || h == null) continue;
    bb = unionRange(bb, x, x + w, y, y + h);
  }

  const circleRe = new RegExp(`<circle\\b[^>]*?\\bcx="${NUM}"[^>]*?\\bcy="${NUM}"[^>]*?\\br="${NUM}"`, 'gi');
  for (const m of svg.matchAll(circleRe)) {
    const cx = num(m[1]); const cy = num(m[2]); const r = num(m[3]);
    if (cx == null || cy == null || r == null) continue;
    bb = unionRange(bb, cx - r, cx + r, cy - r, cy + r);
  }

  const ellipseRe = new RegExp(
    `<ellipse\\b[^>]*?\\bcx="${NUM}"[^>]*?\\bcy="${NUM}"[^>]*?\\brx="${NUM}"[^>]*?\\bry="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(ellipseRe)) {
    const cx = num(m[1]); const cy = num(m[2]); const rx = num(m[3]); const ry = num(m[4]);
    if (cx == null || cy == null || rx == null || ry == null) continue;
    bb = unionRange(bb, cx - rx, cx + rx, cy - ry, cy + ry);
  }

  const lineRe = new RegExp(
    `<line\\b[^>]*?\\bx1="${NUM}"[^>]*?\\by1="${NUM}"[^>]*?\\bx2="${NUM}"[^>]*?\\by2="${NUM}"`,
    'gi',
  );
  for (const m of svg.matchAll(lineRe)) {
    const x1 = num(m[1]); const y1 = num(m[2]); const x2 = num(m[3]); const y2 = num(m[4]);
    if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
    bb = unionRange(bb, Math.min(x1, x2), Math.max(x1, x2), Math.min(y1, y2), Math.max(y1, y2));
  }

  const polyRe = /<(?:polygon|polyline)\b[^>]*?\bpoints="([^"]+)"/gi;
  for (const m of svg.matchAll(polyRe)) {
    const pts = m[1]?.match(/-?[0-9]+(?:\.[0-9]+)?/g) ?? [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const x = parseFloat(pts[i]!);
      const y = parseFloat(pts[i + 1]!);
      if (Number.isFinite(x) && Number.isFinite(y)) bb = unionPoint(bb, x, y);
    }
  }

  // path: absolute commands only. Lowercase variants (relative) are skipped intentionally.
  const pathRe = /<path\b[^>]*?\bd="([^"]+)"/gi;
  for (const m of svg.matchAll(pathRe)) {
    const d = m[1] ?? '';
    const tokens = d.match(/[MLHVQCAS][^MLHVQCASmlhvqcasZz]*/g) ?? [];
    for (const tok of tokens) {
      const cmd = tok[0];
      const nums = tok.slice(1).match(/-?[0-9]+(?:\.[0-9]+)?/g) ?? [];
      if (cmd === 'H') {
        for (const n of nums) {
          const x = parseFloat(n);
          if (Number.isFinite(x)) bb = unionPoint(bb, x, bb?.maxY ?? 0);
        }
      } else if (cmd === 'V') {
        for (const n of nums) {
          const y = parseFloat(n);
          if (Number.isFinite(y)) bb = unionPoint(bb, bb?.maxX ?? 0, y);
        }
      } else {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = parseFloat(nums[i]!);
          const y = parseFloat(nums[i + 1]!);
          if (Number.isFinite(x) && Number.isFinite(y)) bb = unionPoint(bb, x, y);
        }
      }
    }
  }

  return bb;
}

const SHAPE_TAG_RE = /<(?:rect|circle|ellipse|line|polyline|polygon|path)\b/gi;

export function countShapes(svg: string): number {
  return (svg.match(SHAPE_TAG_RE) ?? []).length;
}

const FILL_CURRENT_RE = /<(?:rect|circle|ellipse|line|polyline|polygon|path)\b[^>]*?\bfill="currentColor"/gi;

export function countFills(svg: string): number {
  return (svg.match(FILL_CURRENT_RE) ?? []).length;
}

const MAX_PAYLOAD = 50_000;
const MIN_SHAPES = 1;
const MAX_SHAPES = 60;

// Whitelist for `transform` attribute on <g>. Only the safe SVG transform
// functions are allowed, no arbitrary content. Multiple functions can chain.
const TRANSFORM_OK =
  /^(?:\s*(?:translate|scale|rotate|matrix|skewX|skewY)\s*\([0-9eE+\-.,\s]*\)\s*)+$/;

const ALLOWED_NODES = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const FORBIDDEN_NODES = new Set([
  'script',
  'foreignObject',
  'iframe',
  'style',
  'a',
  'use',
  'image',
  'defs',
  'linearGradient',
  'radialGradient',
  'pattern',
  'mask',
  'clipPath',
  'filter',
]);
const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color']);
const ALLOWED_COLOR_VALUES = new Set(['none', 'currentColor']);

const SHAPE_VFX = ['vector-effect', 'stroke-dasharray'];
const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  path: new Set([
    'd',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'fill-rule',
    'clip-rule',
    ...SHAPE_VFX,
  ]),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', ...SHAPE_VFX]),
  rect: new Set([
    'x',
    'y',
    'width',
    'height',
    'rx',
    'ry',
    'fill',
    'stroke',
    'stroke-width',
    ...SHAPE_VFX,
  ]),
  line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'stroke-linecap', ...SHAPE_VFX]),
  polyline: new Set([
    'points',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    ...SHAPE_VFX,
  ]),
  polygon: new Set([
    'points',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    ...SHAPE_VFX,
  ]),
  ellipse: new Set(['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', ...SHAPE_VFX]),
  g: new Set(['transform', 'stroke-width', 'stroke', 'fill', 'vector-effect']),
};

const CANONICAL_ROOT_ATTRS: Array<[string, string]> = [
  ['xmlns', 'http://www.w3.org/2000/svg'],
  ['viewBox', '0 0 512 512'],
  ['fill', 'none'],
  ['stroke', 'currentColor'],
  ['stroke-width', '6'],
  ['stroke-linecap', 'round'],
  ['stroke-linejoin', 'round'],
];

type ShapeNode = { tag: string; attrs: Record<string, string>; children?: ShapeNode[] };

function escapeXml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeAttrs(node: any): Record<string, string> {
  const out: Record<string, string> = {};
  const a = node[':@'];
  if (a) {
    for (const [k, v] of Object.entries(a)) {
      if (k.startsWith('@_')) out[k.slice(2)] = String(v);
    }
  }
  return out;
}

function findRoot(tree: any[]): any | null {
  for (const node of tree) {
    if (Object.prototype.hasOwnProperty.call(node, 'svg')) return node;
  }
  return null;
}

export function validateAndNormalizeSvg(input: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = input.trim();
  if (trimmed.length === 0) return { ok: false, errors: ['SVG is empty'] };
  if (trimmed.length > MAX_PAYLOAD) {
    return { ok: false, errors: [`SVG exceeds ${MAX_PAYLOAD} bytes (got ${trimmed.length})`] };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    parseAttributeValue: false,
    trimValues: true,
  });
  let tree: any[];
  try {
    tree = parser.parse(trimmed);
  } catch (e: any) {
    return { ok: false, errors: ['SVG XML parse error: ' + (e?.message ?? 'unknown')] };
  }

  const root = findRoot(tree);
  if (!root) return { ok: false, errors: ['Root <svg> not found'] };

  const rootAttrs = nodeAttrs(root);
  if (rootAttrs.viewBox !== '0 0 512 512') {
    errors.push(`viewBox must be "0 0 512 512" (found "${rootAttrs.viewBox ?? ''}")`);
  }
  for (const [name, value] of Object.entries(rootAttrs)) {
    if (COLOR_ATTRS.has(name) && !ALLOWED_COLOR_VALUES.has(value)) {
      errors.push(`Color must be currentColor or none: ${name}="${value}"`);
    }
  }

  const shapeTree: ShapeNode[] = [];
  const walk = (children: any[], out: ShapeNode[]) => {
    for (const node of children) {
      const tag = Object.keys(node).find(k => k !== ':@');
      if (!tag) continue;
      const attrs = nodeAttrs(node);
      if (FORBIDDEN_NODES.has(tag)) {
        errors.push(`Forbidden node: <${tag}>`);
        continue;
      }
      if (tag === 'g') {
        const groupAttrs: Record<string, string> = {};
        const allowedG = ALLOWED_ATTRS_BY_TAG.g;
        for (const [name, value] of Object.entries(attrs)) {
          if (name === 'transform') {
            if (!TRANSFORM_OK.test(value)) {
              errors.push(`Unsafe transform value: "${value}"`);
              groupAttrs.transform = ''; // sentinel so error is surfaced
              continue;
            }
            groupAttrs.transform = value;
            continue;
          }
          if (!allowedG || !allowedG.has(name)) continue;
          if (COLOR_ATTRS.has(name) && !ALLOWED_COLOR_VALUES.has(value)) {
            errors.push(`Color must be currentColor or none: ${name}="${value}"`);
            continue;
          }
          groupAttrs[name] = value;
        }
        const innerOut: ShapeNode[] = [];
        const inner = node[tag];
        if (Array.isArray(inner)) walk(inner, innerOut);
        out.push({ tag: 'g', attrs: groupAttrs, children: innerOut });
        continue;
      }
      if (!ALLOWED_NODES.has(tag)) {
        errors.push(`Unsupported node: <${tag}>`);
        continue;
      }

      for (const [name, value] of Object.entries(attrs)) {
        if (name.startsWith('on')) {
          errors.push(`Forbidden event handler attribute: ${name}`);
          continue;
        }
        if (name === 'style') {
          errors.push('Inline "style" attribute is not allowed');
          continue;
        }
        if (name === 'href' || name === 'xlink:href') {
          if (!/^#/.test(value)) {
            errors.push(`External href is not allowed: ${name}="${value}"`);
            continue;
          }
        }
        if (COLOR_ATTRS.has(name)) {
          if (!ALLOWED_COLOR_VALUES.has(value)) {
            errors.push(`Color must be currentColor or none: ${name}="${value}"`);
            continue;
          }
        }
      }
      out.push({ tag, attrs });
    }
  };
  walk(Array.isArray(root.svg) ? root.svg : [], shapeTree);

  const countLeaves = (nodes: ShapeNode[]): number => {
    let n = 0;
    for (const x of nodes) {
      if (x.tag === 'g') n += countLeaves(x.children || []);
      else n++;
    }
    return n;
  };
  const leafCount = countLeaves(shapeTree);
  if (leafCount < MIN_SHAPES) errors.push(`At least ${MIN_SHAPES} shape required`);
  if (leafCount > MAX_SHAPES) {
    errors.push(`Too many shapes (max ${MAX_SHAPES}, got ${leafCount})`);
  }

  if (errors.length > 0) return { ok: false, errors };

  const emit = (nodes: ShapeNode[]): string => {
    let out = '';
    for (const c of nodes) {
      if (c.tag === 'g') {
        const a = Object.entries(c.attrs)
          .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
          .join('');
        out += `<g${a}>${emit(c.children || [])}</g>`;
        continue;
      }
      const allow = ALLOWED_ATTRS_BY_TAG[c.tag];
      if (!allow) continue;
      const kept: Record<string, string> = {};
      for (const [k, v] of Object.entries(c.attrs)) {
        if (!allow.has(k)) continue;
        if (k === 'd' && (!v || v.trim() === '')) continue;
        kept[k] = v;
      }
      if (c.tag === 'path' && !('d' in kept)) continue;
      const a = Object.entries(kept)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join('');
      out += `<${c.tag}${a}/>`;
    }
    return out;
  };

  const rootOpen = '<svg' + CANONICAL_ROOT_ATTRS.map(([k, v]) => ` ${k}="${v}"`).join('') + '>';
  const normalizedSvg = `${rootOpen}${emit(shapeTree)}</svg>`;

  // Soft warnings (do not block save; surfaced in UI for user awareness)
  const warnings: string[] = [];
  const bbox = extractBBox(normalizedSvg);
  if (bbox) {
    const spanX = bbox.maxX - bbox.minX;
    const spanY = bbox.maxY - bbox.minY;
    if (spanX < 400) warnings.push(`Canvas under-used on x axis (span=${Math.round(spanX)})`);
    if (spanY < 400) warnings.push(`Canvas under-used on y axis (span=${Math.round(spanY)})`);
  }
  const shapeCount = countShapes(normalizedSvg);
  if (shapeCount < 14 || shapeCount > 24) {
    warnings.push(`Shape count ${shapeCount} outside [14,24] target`);
  }
  const fillCount = countFills(normalizedSvg);
  if (fillCount < 3) {
    warnings.push(`Only ${fillCount} filled regions — duotone may look flat`);
  }

  return { ok: true, svg: normalizedSvg, warnings };
}

const NANO = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export type MetaInput = {
  name?: string;
  tags?: string[];
  category?: string;
  description?: string;
};
export type MetaResult = { ok: true; meta: IconMeta } | { ok: false; errors: string[] };

export function validateMeta(input: MetaInput): MetaResult {
  const errors: string[] = [];
  const name = (input.name ?? '').trim();
  if (name.length === 0) errors.push('name is required');
  if (name.length > 64) errors.push('name must be 64 chars or fewer');

  const tagsRaw = Array.isArray(input.tags) ? input.tags : [];
  const tagsLower = tagsRaw
    .map(t => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter(t => t.length > 0 && t.length <= 30);
  const tags = Array.from(new Set(tagsLower));
  if (tags.length > 20) errors.push('too many tags (max 20)');

  const category = (input.category ?? '').trim();
  if (category.length > 30) errors.push('category must be 30 chars or fewer');

  const description = (input.description ?? '').trim();
  if (description.length > 500) errors.push('description must be 500 chars or fewer');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, meta: { name, tags, category, description } };
}

export function makeSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) return `icon-${NANO()}`;
  return slug;
}

export function makeFallbackSlug(base: string): string {
  return `${base}-${NANO()}`;
}

export type ResultItem = {
  id: string;
  svg: string; // normalized SVG (or original if validation failed)
  validation: ValidationResult;
  rawMeta: ParsedItem['meta'];
};
