<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tr
    :class="
      cn('hover:bg-muted/50 border-b transition-colors data-[state=selected]:bg-muted', props.class)
    ">
    <slot />
  </tr>
</template>
