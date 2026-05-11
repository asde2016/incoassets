<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    :class="
      cn('flex gap-8 rounded-md bg-primary-foreground p-8 text-16 text-primary', props.class)
    ">
    <div class="flex h-[1lh] shrink-0 items-center">
      <slot name="icon">
        <i class="material-icons text-16">info</i>
      </slot>
    </div>
    <p><slot /></p>
  </div>
</template>
