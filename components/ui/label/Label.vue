<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  for?: string;
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <label :for="props.for" :class="cn('mb-4 mr-4 inline-block text-sm text-gray-700', props.class)">
    <slot />
  </label>
</template>
