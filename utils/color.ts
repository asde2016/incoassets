const HEX6 = /^#?([0-9a-fA-F]{6})$/;

export function normHex(hex: string): string {
  const m = hex.match(HEX6);
  if (!m) throw new Error(`normHex: invalid hex "${hex}"`);
  return `#${m[1].toUpperCase()}`;
}

export function darken(hex: string, amount: number): string {
  const norm = normHex(hex);
  const raw = norm.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const k = 1 - Math.max(0, Math.min(1, amount));
  const ch = (v: number) =>
    Math.round(v * k)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

// Rec. 601 perceived luminance (0..255 range).
export function luminance(hex: string): number {
  const norm = normHex(hex);
  const raw = norm.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 밝은 아이콘 → 검정 배경, 어두운 아이콘 → 흰 배경.
// 임계 200 은 사용자 명세 그대로 (Rec.601 luminance > 200 이면 black).
export function pickBackground(baseHex: string): '#FFFFFF' | '#000000' {
  return luminance(baseHex) > 200 ? '#000000' : '#FFFFFF';
}
