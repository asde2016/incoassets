import { ref } from 'vue';
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { cn } from '~/utils/shadcn';

// Nuxt auto-imports `cn` globally; expose it via Vue globalProperties for tests
// so SFC templates that reference `cn(...)` resolve correctly.
config.global.config = config.global.config ?? ({} as typeof config.global.config);
config.global.config.globalProperties = config.global.config.globalProperties ?? {};
config.global.config.globalProperties.cn = cn;

// reka-ui's TeleportPrimitive uses useMounted() to gate the Teleport render.
// In happy-dom (synchronous test environment) the onMounted callback fires
// after the first tick, so portals don't appear synchronously in tests.
// We mock useMounted to always return ref(true) so portals render immediately.
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMounted: () => ref(true),
  };
});
