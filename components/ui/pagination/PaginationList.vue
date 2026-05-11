<script setup lang="ts">
import { PaginationList } from 'reka-ui';
</script>

<template>
  <PaginationList class="flex items-center gap-4">
    <template #default="{ items }">
      <slot :items="items" />
    </template>
  </PaginationList>
</template>
