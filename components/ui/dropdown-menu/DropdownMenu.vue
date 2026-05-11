<script setup lang="ts">
import type { DropdownMenuRootEmits, DropdownMenuRootProps } from 'reka-ui';
import { provide } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuRoot, useForwardPropsEmits } from 'reka-ui';

type DropdownMenuSize = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<DropdownMenuRootProps & { size?: DropdownMenuSize; ghost?: boolean }>(),
  { size: 'md', ghost: false }
);
const emits = defineEmits<DropdownMenuRootEmits>();

provide('dropdownMenuSize', props.size);
provide('dropdownMenuGhost', props.ghost);

const delegatedProps = reactiveOmit(props, 'size', 'ghost');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DropdownMenuRoot v-bind="forwarded">
    <slot />
  </DropdownMenuRoot>
</template>
