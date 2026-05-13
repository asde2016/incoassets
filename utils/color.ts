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
