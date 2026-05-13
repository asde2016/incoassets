// stores/customize.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ColorMode = 'duotone' | 'linear';

const DEFAULTS = {
  size: 96,
  // SVG 의 baseline (PNG 측정 두께) 위에 더해지는 추가 두께. 1~8 범위.
  strokeWidth: 1,
  mode: 'duotone' as ColorMode,
  color: '#57A3FF',
};

export const useCustomize = defineStore('customize', () => {
  const size = ref<number>(DEFAULTS.size);
  const strokeWidth = ref<number>(DEFAULTS.strokeWidth);
  const mode = ref<ColorMode>(DEFAULTS.mode);
  const color = ref<string>(DEFAULTS.color);

  function reset() {
    size.value = DEFAULTS.size;
    strokeWidth.value = DEFAULTS.strokeWidth;
    mode.value = DEFAULTS.mode;
    color.value = DEFAULTS.color;
  }

  // Migrate legacy localStorage value 'default' → 'duotone'
  function migrate() {
    if ((mode.value as string) === 'default') {
      mode.value = 'duotone';
    }
  }

  return {
    size,
    strokeWidth,
    mode,
    color,
    reset,
    migrate,
  };
});
