<script setup lang="ts">
type ScreenSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const props = withDefaults(
  defineProps<{
    size?: ScreenSize;
  }>(),
  {
    size: '2xl',
  }
);

const sizeClasses: Record<ScreenSize, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};
</script>

<template>
  <div :class="['mx-auto w-full px-24 xl:px-32 2xl:px-28', sizeClasses[size]]">
    <slot />
  </div>
</template>
