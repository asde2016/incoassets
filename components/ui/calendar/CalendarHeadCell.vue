<script lang="ts" setup>
import type { CalendarHeadCellProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CalendarHeadCell, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<CalendarHeadCellProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarHeadCell
    :class="cn('w-32 rounded-md text-[12px] font-normal text-muted-foreground', props.class)"
    v-bind="forwardedProps">
    <slot />
  </CalendarHeadCell>
</template>
