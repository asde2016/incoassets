export type ColorMode = 'duotone' | 'linear';

const DEFAULTS = {
  size: 96,
  // SVG 의 baseline (PNG 측정 두께) 위에 더해지는 추가 두께. CustomizePanel 슬라이더 1~8.
  strokeWidth: 1,
  mode: 'duotone' as ColorMode,
  color: '#57A3FF',
};

export const useCustomizeStore = defineStore('customize', {
  state: () => ({
    size: DEFAULTS.size,
    strokeWidth: DEFAULTS.strokeWidth,
    mode: DEFAULTS.mode,
    color: DEFAULTS.color,
  }),

  actions: {
    reset() {
      this.size = DEFAULTS.size;
      this.strokeWidth = DEFAULTS.strokeWidth;
      this.mode = DEFAULTS.mode;
      this.color = DEFAULTS.color;
    },
  },
});
