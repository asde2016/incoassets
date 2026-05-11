<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-dialog-part="header"
    :class="cn('flex flex-col gap-y-4 text-center sm:text-left', props.class)">
    <slot />
  </div>
</template>
