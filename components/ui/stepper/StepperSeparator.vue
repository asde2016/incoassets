<script lang="ts" setup>
import type { StepperSeparatorProps } from 'reka-ui';
import type { HTMLAttributes, Ref } from 'vue';
import { reactiveOmit } from '@vueuse/core';

import { StepperSeparator, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperSeparatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);

const orientation = inject<Ref<string>>('stepper-orientation', ref('horizontal'));
const isVertical = computed(() => orientation.value === 'vertical');
</script>

<template>
  <StepperSeparator
    v-bind="forwarded"
    :class="
      cn(
        'absolute rounded-full bg-gray-200 transition-all',
        isVertical
          ? 'bottom-0 left-[13px] top-28 w-2'
          : 'left-[100%] right-0 top-[13px] h-2 w-[calc(100%-28px)] translate-x-[-50%]',
        // Disabled
        'group-data-[disabled]:opacity-50',
        // Completed
        'group-data-[state=completed]:bg-primary',
        props.class
      )
    " />
</template>
