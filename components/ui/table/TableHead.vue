<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <th
    :class="
      cn(
        'bg-gray-100 px-16 py-8 text-left align-middle font-medium text-gray-900 [&:has([role=checkbox])]:pr-0',
        props.class
      )
    ">
    <slot />
  </th>
</template>
