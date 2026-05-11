<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { PaginationPrev } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <Button as-child variant="ghost" size="icon-sm">
    <PaginationPrev :class="cn('py-8', props.class)">
      <i class="material-icons-round text-18">chevron_left</i>
    </PaginationPrev>
  </Button>
</template>
