<script setup lang="ts">
import type { PaginationListItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { PaginationListItem } from 'reka-ui';

const props = defineProps<PaginationListItemProps & { class?: HTMLAttributes['class'] }>();
const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <PaginationListItem :class="cn(props.class)" v-bind="delegatedProps">
    <slot />
  </PaginationListItem>
</template>
