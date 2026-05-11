<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div class="relative w-full overflow-auto rounded-md border">
    <table v-bind="$attrs" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
