<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { PaginationFirst } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <Button as-child variant="ghost" size="icon-sm">
    <PaginationFirst :class="cn('py-8', props.class)">
      <i class="material-icons-round text-lg">first_page</i>
    </PaginationFirst>
  </Button>
</template>
