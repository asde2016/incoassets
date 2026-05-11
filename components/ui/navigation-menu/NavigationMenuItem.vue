<script setup lang="ts">
import type { NavigationMenuItemProps } from 'reka-ui';
import { NavigationMenuItem } from 'reka-ui';

const props = defineProps<NavigationMenuItemProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <NavigationMenuItem :class="cn('', props.class)" v-bind="props">
    <slot />
  </NavigationMenuItem>
</template>
