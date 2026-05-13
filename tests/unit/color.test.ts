import { describe, it, expect } from 'vitest';
import { normHex, darken } from '~/utils/color';

describe('normHex', () => {
  it('lowercase 6자리 → upper-case with prefix', () => {
    expect(normHex('256bfa')).toBe('#256BFA');
  });
  it('prefix 있는 입력도 받음', () => {
    expect(normHex('#256BFA')).toBe('#256BFA');
  });
  it('잘못된 길이는 throw', () => {
    expect(() => normHex('#FFF')).toThrow();
    expect(() => normHex('256BF')).toThrow();
  });
  it('잘못된 문자는 throw', () => {
    expect(() => normHex('#GG0000')).toThrow();
  });
});

describe('darken', () => {
  it('amount=0.4 → 각 채널 × 0.6 반올림', () => {
    // #256BFA = (37, 107, 250) → × 0.6 = (22.2, 64.2, 150.0) → round = (22, 64, 150) = #164096
    expect(darken('#256BFA', 0.4)).toBe('#164096');
  });
  it('amount=0 → 입력 그대로 (대문자/prefix 정규화 포함)', () => {
    expect(darken('256bfa', 0)).toBe('#256BFA');
  });
  it('amount=1 → 검정', () => {
    expect(darken('#FFFFFF', 1)).toBe('#000000');
  });
  it('amount 범위 밖은 clamp', () => {
    expect(darken('#FFFFFF', -1)).toBe('#FFFFFF');
    expect(darken('#FFFFFF', 2)).toBe('#000000');
  });
});
