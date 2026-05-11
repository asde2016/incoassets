<script lang="ts" setup>
import type { StepperIndicatorProps } from 'reka-ui';
import type { HTMLAttributes, Ref } from 'vue';
import { reactiveOmit } from '@vueuse/core';

import { StepperIndicator, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);

const orientation = inject<Ref<string>>('stepper-orientation', ref('horizontal'));
const isVertical = computed(() => orientation.value === 'vertical');
</script>

<template>
  <StepperIndicator
    v-slot="slotProps"
    v-bind="forwarded"
    :class="
      cn(
        'absolute top-0 inline-flex h-[28px] w-[28px] items-center justify-center rounded-full text-14 font-medium transition-all',
        isVertical
          ? 'left-0'
          : 'left-[50%] translate-x-[-50%]',
        'bg-gray-200 text-gray-500',
        // Disabled
        'group-data-[disabled]:opacity-50',
        // Active
        'group-data-[state=active]:bg-primary group-data-[state=active]:text-white',
        // Completed
        'group-data-[state=completed]:bg-primary group-data-[state=completed]:text-white',
        props.class
      )
    ">
    <slot v-bind="slotProps" />
  </StepperIndicator>
</template>
