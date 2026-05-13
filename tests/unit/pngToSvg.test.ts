import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { pngToSvg } from '~/server/utils/pngToSvg';

// PNG 는 항상 고정 색상으로 생성됨: base #2E5BFF, stroke #000000, bg #FFFFFF.
async function makeSyntheticPng(): Promise<Buffer> {
  const w = 32;
  const h = 32;
  const buf = Buffer.alloc(w * h * 4);
  const set = (x: number, y: number, r: number, g: number, b: number) => {
    const i = (y * w + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  };
  // 흰 배경
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, 255, 255, 255);
  // 검정 십자 = stroke (#000000)
  for (let i = 6; i <= 26; i++) {
    set(i, 16, 0, 0, 0);
    set(16, i, 0, 0, 0);
  }
  // 파란 사각형 = base (#2E5BFF = (46, 91, 255))
  for (let y = 18; y <= 22; y++) for (let x = 18; x <= 22; x++) set(x, y, 46, 91, 255);
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

describe('pngToSvg', () => {
  it('고정-색 PNG → fill/stroke 두 layer SVG (polygon-as-stroke)', async () => {
    const pngBuf = await makeSyntheticPng();
    const svg = await pngToSvg(pngBuf, { baseHex: '#10B981' });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('fill-rule="evenodd"');

    // baseline 메타
    expect(svg).toMatch(/data-baseline-stroke-512="[\d.]+"/);
    expect(svg).toMatch(/data-baseline-stroke-vb="[\d.]+"/);

    // fill 레이어 - 출력 baseHex 그대로
    expect(svg).toMatch(/<g\s+class="icon-fill"\s+fill="#10B981"/);

    // stroke 레이어 - potrace polygon 을 fill 로 채워 baseline 두께 재현.
    // stroke 속성은 추가 확장(stroke-width > 0) 용으로 유지, 기본 stroke-width="0".
    expect(svg).toMatch(/<g\s+class="icon-stroke"\s+fill="#[0-9A-F]{6}"/);
    expect(svg).not.toMatch(/<g\s+class="icon-stroke"\s+fill="none"/);
    expect(svg).toMatch(/stroke="#[0-9A-F]{6}"/);
    expect(svg).toContain('stroke-width="0"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('stroke-linejoin="round"');

    const pathCount = (svg.match(/<path\b/g) ?? []).length;
    expect(pathCount).toBeGreaterThan(0);
  }, 30_000);

  it('strokeHex 명시 → stroke 레이어 fill·stroke 둘 다 그 색 반영', async () => {
    const pngBuf = await makeSyntheticPng();
    const svg = await pngToSvg(pngBuf, { baseHex: '#10B981', strokeHex: '#064A33' });
    expect(svg).toMatch(/<g\s+class="icon-stroke"\s+fill="#064A33"\s+stroke="#064A33"/);
  }, 30_000);

  it('strokeHex 생략 → darken(baseHex, 0.6) 으로 자동 유도, fill·stroke 동일 색', async () => {
    const pngBuf = await makeSyntheticPng();
    // #2E5BFF 채널들에 0.4 곱: (46×0.4, 91×0.4, 255×0.4) = (18, 36, 102) = #122466
    const svg = await pngToSvg(pngBuf, { baseHex: '#2E5BFF' });
    expect(svg).toMatch(/<g\s+class="icon-stroke"\s+fill="#122466"\s+stroke="#122466"/);
  }, 30_000);

  it('배경만 있는 PNG (subject 없음) → throw', async () => {
    const buf = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    await expect(pngToSvg(buf, { baseHex: '#10B981' })).rejects.toThrow(/empty subject/);
  });
});
