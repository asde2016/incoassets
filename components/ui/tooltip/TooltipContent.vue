<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 8, // 간격
    side: 'bottom', // 위치
  }
);

const emits = defineEmits<TooltipContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'relative z-50 rounded-md bg-gray-600 p-8 text-sm text-gray-100 shadow-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-4 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'before:absolute before:border-[10px] before:border-transparent before:content-[\'\']',
          'data-[side=bottom]:before:left-1/2 data-[side=bottom]:before:top-[-16px] data-[side=bottom]:before:-translate-x-1/2 data-[side=bottom]:before:border-b-gray-600',
          'data-[side=top]:before:bottom-[-16px] data-[side=top]:before:left-1/2 data-[side=top]:before:-translate-x-1/2 data-[side=top]:before:border-t-gray-600',
          'data-[side=left]:before:right-[-16px] data-[side=left]:before:top-1/2 data-[side=left]:before:-translate-y-1/2 data-[side=left]:before:border-l-gray-600',
          'data-[side=right]:before:left-[-16px] data-[side=right]:before:top-1/2 data-[side=right]:before:-translate-y-1/2 data-[side=right]:before:border-r-gray-600',
          props.class
        )
      ">
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
