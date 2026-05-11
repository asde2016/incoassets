<script lang="ts" setup>
import type { CalendarCellProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CalendarCell, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<CalendarCellProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarCell
    :class="
      cn(
        'relative h-32 w-32 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:rounded-md [&:has([data-selected])]:bg-accent [&:has([data-selected][data-outside-view])]:bg-primary-foreground',
        props.class
      )
    "
    v-bind="forwardedProps">
    <slot />
  </CalendarCell>
</template>
