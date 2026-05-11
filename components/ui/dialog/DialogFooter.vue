<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div data-dialog-part="footer" :class="cn('flex gap-8 [&>*]:w-full', props.class)">
    <slot />
  </div>
</template>
