<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div :class="cn('mt-auto', props.class)">
    <slot />
  </div>
</template>
