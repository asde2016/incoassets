<script setup lang="ts">
import type { DropdownMenuItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { inject } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuItem, useForwardProps } from 'reka-ui';

const props = defineProps<
  DropdownMenuItemProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class');
const forwardedProps = useForwardProps(delegatedProps);

const size = inject('dropdownMenuSize', 'md') as 'sm' | 'md' | 'lg';
const sizeClass = {
  sm: 'px-8 py-9 text-sm',
  md: 'px-10 py-11 text-md',
  lg: 'px-12 py-11 text-lg',
}[size];
</script>

<template>
  <DropdownMenuItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex select-none items-center gap-2 rounded-md font-medium outline-none transition-colors focus:bg-primary-foreground focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
        sizeClass,
        inset && 'pl-8',
        props.class
      )
    ">
    <slot />
  </DropdownMenuItem>
</template>
