<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { PaginationLast } from 'reka-ui';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <Button as-child variant="ghost" size="icon-sm">
    <PaginationLast :class="cn('py-8', props.class)">
      <i class="material-icons-round text-lg">last_page</i>
    </PaginationLast>
  </Button>
</template>
