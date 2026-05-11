<script setup lang="ts">
import type { DropdownMenuTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { inject } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuTrigger, useForwardProps } from 'reka-ui';

const props = defineProps<
  DropdownMenuTriggerProps & { class?: HTMLAttributes['class']; disabled?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class', 'disabled');
const forwardedProps = useForwardProps(delegatedProps);

const size = inject('dropdownMenuSize', 'md') as 'sm' | 'md' | 'lg';
const sizeClass = {
  sm: 'px-14 py-9 text-sm',
  md: 'px-16 py-11 text-md',
  lg: 'px-18 py-11 text-lg',
}[size];

const ghost = inject('dropdownMenuGhost', false) as boolean;
</script>

<template>
  <div :class="cn('group relative', ghost && 'w-fit')">
    <DropdownMenuTrigger
      :disabled="props.disabled"
      :class="
        cn(
          'peer flex items-center rounded-md outline-none',
          ghost
            ? 'w-fit hover:bg-accent focus:bg-accent'
            : 'w-full border border-border hover:border-primary focus:border-primary data-[state=open]:border-primary',
          props.disabled && 'pointer-events-none opacity-50',
          sizeClass,
          props.class
        )
      "
      v-bind="forwardedProps">
      <slot />
    </DropdownMenuTrigger>
    <i
      v-if="!ghost"
      :class="
        cn(
          'material-icons pointer-events-none absolute right-8 top-[50%] translate-y-[-50%] transition-transform duration-300 peer-data-[state=open]:-rotate-180',
          props.disabled && 'opacity-50'
        )
      ">
      keyboard_arrow_down
    </i>
  </div>
</template>
