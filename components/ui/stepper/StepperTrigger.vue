<script lang="ts" setup>
import type { StepperTriggerProps } from 'reka-ui';
import type { HTMLAttributes, Ref } from 'vue';
import { reactiveOmit } from '@vueuse/core';

import { StepperTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);

const stepMove = inject<Ref<boolean>>('stepper-move', ref(true));
const orientation = inject<Ref<string>>('stepper-orientation', ref('horizontal'));
const isVertical = computed(() => orientation.value === 'vertical');
</script>

<template>
  <StepperTrigger
    v-bind="forwarded"
    :class="
      cn(
        'relative flex flex-col gap-8',
        isVertical
          ? 'items-start pl-40 pb-24'
          : 'items-center pt-34',
        !stepMove && 'pointer-events-none',
        props.class
      )
    ">
    <slot />
  </StepperTrigger>
</template>
