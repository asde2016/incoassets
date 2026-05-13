// 저장된 SVG (pngToSvg 출력) 에 customize state 를 적용.
// 새 SVG 스키마:
//   <svg viewBox="0 0 512 512" fill-rule="evenodd"
//        data-baseline-stroke-512="..." data-baseline-stroke-vb="...">
//     <g class="icon-fill" fill="${baseHex}">...</g>
//     <g class="icon-stroke" fill="${strokeHex}" stroke="${strokeHex}"
//        stroke-width="0" stroke-linecap="round" stroke-linejoin="round">...</g>
//   </svg>
//
// stroke 레이어는 potrace polygon 을 fill 로 채워 baseline 두께 재현.
// stroke 속성은 추가 확장(stroke-width > 0)을 위해 함께 유지.

import { darken, normHex } from '~/utils/color';

export type CustomizeState = {
  size: number;
  strokeWidth: number;
  mode: 'duotone' | 'linear';
  color: string;
};

const ROOT_OPEN_RE = /<svg\b([^>]*)>/i;
const FILL_GROUP_RE =
  /<g\b([^>]*)\bclass="icon-fill"([^>]*)>([\s\S]*?)<\/g>/i;
const STROKE_GROUP_RE =
  /<g\b([^>]*)\bclass="icon-stroke"([^>]*)>([\s\S]*?)<\/g>/i;

export function applyCustomize(svg: string, c: CustomizeState): string {
  const base = normHex(c.color);
  // pngToSvg.ts 와 일치 — 채널 × 0.4.
  const strokeHex = darken(base, 0.6);

  let out = svg.replace(ROOT_OPEN_RE, (_m, attrs: string) => {
    let a = setOrAddAttr(attrs, 'width', String(c.size));
    a = setOrAddAttr(a, 'height', String(c.size));
    return `<svg${a}>`;
  });

  // stroke-width 는 baseline 위 "추가" 두께. 0 = PNG 그대로, +N = 양쪽 N/2 만큼 두꺼워짐.
  const sw = String(Math.max(0, c.strokeWidth));

  if (c.mode === 'linear') {
    // 내부 fill 영역 제거하고 외곽 stroke 레이어만 base 단일톤으로.
    out = out.replace(FILL_GROUP_RE, '');
    out = out.replace(
      STROKE_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        let combined = setOrAddAttr(before + after, 'fill', base);
        combined = setOrAddAttr(combined, 'stroke', base);
        combined = setOrAddAttr(combined, 'stroke-width', sw);
        return `<g${combined} class="icon-stroke">${inner}</g>`;
      }
    );
  } else {
    // duotone: 내부는 base, 외곽 stroke 레이어는 darken(base, 0.6).
    out = out.replace(
      FILL_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        const combined = setOrAddAttr(before + after, 'fill', base);
        return `<g${combined} class="icon-fill">${inner}</g>`;
      }
    );
    out = out.replace(
      STROKE_GROUP_RE,
      (_m, before: string, after: string, inner: string) => {
        let combined = setOrAddAttr(before + after, 'fill', strokeHex);
        combined = setOrAddAttr(combined, 'stroke', strokeHex);
        combined = setOrAddAttr(combined, 'stroke-width', sw);
        return `<g${combined} class="icon-stroke">${inner}</g>`;
      }
    );
  }

  return out;
}

function setOrAddAttr(attrs: string, name: string, value: string): string {
  // name= 뒤가 '"…"' 인 속성만 매칭. stroke-linecap 등 하이픈 이어진 이름은 자체 매칭됨.
  const re = new RegExp(`(\\s${name}\\s*=\\s*")[^"]*(")`, 'i');
  if (re.test(attrs)) return attrs.replace(re, `$1${value}$2`);
  return `${attrs} ${name}="${value}"`;
}
