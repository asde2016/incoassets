// Apply customize state to a stored SVG that has data-layer="fill"/"stroke" markers.
// Both layers are closed paths drawn with `fill="…"` — there is no SVG stroke.

import { darken, normHex } from '~/utils/color';

export type CustomizeState = {
  size: number;
  strokeWidth: number;
  mode: 'duotone' | 'linear';
  color: string;
};

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;
const FILL_GROUP_RE =
  /<g\b([^>]*)\bdata-layer="fill"([^>]*)>([\s\S]*?)<\/g>/i;
const STROKE_GROUP_RE =
  /<g\b([^>]*)\bdata-layer="stroke"([^>]*)>([\s\S]*?)<\/g>/i;

export function applyCustomize(svg: string, c: CustomizeState): string {
  const base = normHex(c.color);
  const strokeHex = darken(base, 0.4);

  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = setOrAddAttr(attrs, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    return `<svg${a}>`;
  });

  if (c.mode === 'linear') {
    // 내부 fill 영역 제거하고 외곽(stroke) layer 만 남김. base 색으로 단일톤.
    out = out.replace(FILL_GROUP_RE, '');
    out = out.replace(
      STROKE_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        const combined = setOrAddAttr(before + after, 'fill', base);
        return `<g${combined} data-layer="stroke">${inner}</g>`;
      }
    );
  } else {
    // duotone: 내부는 base, 외곽 stroke layer 는 darken(base, 0.4).
    out = out.replace(
      FILL_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        const combined = setOrAddAttr(before + after, 'fill', base);
        return `<g${combined} data-layer="fill">${inner}</g>`;
      }
    );
    out = out.replace(
      STROKE_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        const combined = setOrAddAttr(before + after, 'fill', strokeHex);
        return `<g${combined} data-layer="stroke">${inner}</g>`;
      }
    );
  }

  return out;
}

function setOrAddAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}
