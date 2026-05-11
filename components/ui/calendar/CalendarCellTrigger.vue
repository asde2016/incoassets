<script lang="ts" setup>
import type { CalendarCellTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CalendarCellTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import { buttonVariants } from '@/components/ui/button';

const props = defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarCellTrigger
    :class="
      cn(
        buttonVariants({ variant: 'ghost' }),
        'h-32 w-32 p-0 text-[15px]',
        '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
        // Selected
        'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100 data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground',
        // Outside months
        '[&[data-outside-view][data-selected]]:bg-accent/50 data-[outside-view]:text-gray-800 data-[outside-view]:opacity-50 [&[data-outside-view][data-selected]]:text-gray-500 [&[data-outside-view][data-selected]]:opacity-30',
        // Disabled
        'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
        // Unavailable
        'data-[unavailable]:text-gray-300',
        props.class
      )
    "
    v-bind="forwardedProps">
    <slot />
  </CalendarCellTrigger>
</template>
