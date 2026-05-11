<script lang="ts" setup>
import type { RangeCalendarPrevProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RangeCalendarPrev, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import { buttonVariants } from '@/components/ui/button';

const props = defineProps<RangeCalendarPrevProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarPrev
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
  </RangeCalendarPrev>
</template>
