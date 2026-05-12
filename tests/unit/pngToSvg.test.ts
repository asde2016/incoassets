import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { pngToSvg } from '~/server/utils/pngToSvg';

// classify 가 정확히 매칭되도록 PNG 의 픽셀 색을 base/stroke hex 와 동일하게 칠한다.
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
  // 어두운 십자 = stroke (darken(#256BFA, 0.4) = #164096 = (22, 64, 150))
  for (let i = 6; i <= 26; i++) {
    set(i, 16, 22, 64, 150);
    set(16, i, 22, 64, 150);
  }
  // 밝은 사각형 = base (#256BFA = (37, 107, 250))
  for (let y = 18; y <= 22; y++) for (let x = 18; x <= 22; x++) set(x, y, 37, 107, 250);
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

describe('pngToSvg', () => {
  it('흰 배경 + duotone 합성 PNG → 두 layer 가 closed path 로 변환됨', async () => {
    const pngBuf = await makeSyntheticPng();
    const svg = await pngToSvg(pngBuf, { baseHex: '#256BFA', backgroundHex: '#FFFFFF' });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 512 512"');
    expect(svg).toContain('fill-rule="evenodd"');

    expect(svg).toMatch(/<g\b[^>]*data-layer="fill"/);
    expect(svg).toMatch(/<g\b[^>]*data-layer="stroke"/);

    // 두 layer 모두 fill 속성으로 색칠 (stroke 속성 없음)
    expect(svg).toContain('fill="#256BFA"');
    expect(svg).toContain('fill="#164096"');

    const pathCount = (svg.match(/<path\b/g) ?? []).length;
    expect(pathCount).toBeGreaterThan(0);
  }, 30_000);

  it('backgroundHex 생략 시 baseHex 로부터 자동 결정 (어두운 base → 흰 배경)', async () => {
    const pngBuf = await makeSyntheticPng();
    const svg = await pngToSvg(pngBuf, { baseHex: '#256BFA' });
    expect(svg).toContain('fill="#256BFA"');
    expect((svg.match(/<path\b/g) ?? []).length).toBeGreaterThan(0);
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
    await expect(
      pngToSvg(buf, { baseHex: '#256BFA', backgroundHex: '#FFFFFF' })
    ).rejects.toThrow(/empty subject/);
  });
});
