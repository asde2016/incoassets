<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { PaginationNext } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <Button as-child variant="ghost" size="icon-sm">
    <PaginationNext :class="cn('py-8', props.class)">
      <i class="material-icons-round text-18">chevron_right</i>
    </PaginationNext>
  </Button>
</template>
