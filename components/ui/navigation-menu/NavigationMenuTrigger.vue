<script setup lang="ts">
import type { NavigationMenuTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { NavigationMenuTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import { navigationMenuTriggerStyle } from '.';

const props = defineProps<NavigationMenuTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <NavigationMenuTrigger
    v-bind="forwardedProps"
    :class="cn(navigationMenuTriggerStyle(), 'group h-fit items-center text-[15px]', props.class)">
    <slot />

    <i
      v-if="!(typeof props.class === 'string' && props.class.includes('no-chevron'))"
      aria-hidden="true"
      class="material-icons relative top-px ml-4 transition duration-200 group-data-[state=open]:-rotate-180">
      keyboard_arrow_down
    </i>
  </NavigationMenuTrigger>
</template>
