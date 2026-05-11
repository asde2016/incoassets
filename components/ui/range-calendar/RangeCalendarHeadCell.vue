<script lang="ts" setup>
import type { RangeCalendarHeadCellProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RangeCalendarHeadCell, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<RangeCalendarHeadCellProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarHeadCell
    :class="cn('w-32 rounded-md text-[12px] font-normal text-muted-foreground', props.class)"
    v-bind="forwardedProps">
    <slot />
  </RangeCalendarHeadCell>
</template>
