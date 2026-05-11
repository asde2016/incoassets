<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { PaginationEllipsis } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <PaginationEllipsis
    :class="cn('flex h-36 w-36 items-center justify-center text-gray-400', props.class)">
    <i class="material-icons-round text-18">more_horiz</i>
  </PaginationEllipsis>
</template>
