<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div :class="cn('flex flex-col gap-x-8', props.class)">
    <div class="flex gap-8">
      <div class="flex h-[1lh] shrink-0 items-center">
        <slot name="switch" />
      </div>
      <slot />
    </div>
  </div>
</template>
