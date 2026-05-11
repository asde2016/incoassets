<script setup lang="ts">
import type { DropdownMenuLabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuLabel, useForwardProps } from 'reka-ui';

const props = defineProps<
  DropdownMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuLabel
    v-bind="forwardedProps"
    :class="cn('px-8 py-2 text-[12px] font-semibold text-gray-500', inset && 'pl-8', props.class)">
    <slot />
  </DropdownMenuLabel>
</template>
