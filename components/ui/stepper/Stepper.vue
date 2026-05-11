<script lang="ts" setup>
import type { StepperRootEmits, StepperRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { StepperRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = withDefaults(
  defineProps<StepperRootProps & { class?: HTMLAttributes['class']; stepMove?: boolean }>(),
  { stepMove: true }
);
const emits = defineEmits<StepperRootEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'stepMove');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

provide(
  'stepper-move',
  toRef(() => props.stepMove)
);

provide(
  'stepper-orientation',
  toRef(() => props.orientation ?? 'horizontal')
);
</script>

<template>
  <StepperRoot
    v-slot="slotProps"
    :class="
      cn(
        'flex',
        props.orientation === 'vertical'
          ? 'flex-col items-stretch'
          : 'items-start justify-center',
        props.class
      )
    "
    v-bind="forwarded">
    <slot v-bind="slotProps" />
  </StepperRoot>
</template>
