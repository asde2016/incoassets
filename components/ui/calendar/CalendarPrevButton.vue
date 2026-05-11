<script lang="ts" setup>
import type { CalendarPrevProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CalendarPrev, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import { buttonVariants } from '@/components/ui/button';

const props = defineProps<CalendarPrevProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarPrev
    :class="
      cn(
        buttonVariants({ variant: 'outline' }),
        'h-24 w-24 bg-transparent p-0 opacity-50 hover:opacity-100',
        props.class
      )
    "
    v-bind="forwardedProps">
    <slot>
      <i class="material-icons text-gray-600">keyboard_arrow_left</i>
    </slot>
  </CalendarPrev>
</template>
