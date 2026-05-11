<script lang="ts" setup>
import type { StepperDescriptionProps } from 'reka-ui';
import type { HTMLAttributes, Ref } from 'vue';
import { reactiveOmit } from '@vueuse/core';

import { StepperDescription, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperDescriptionProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);

const orientation = inject<Ref<string>>('stepper-orientation', ref('horizontal'));
const isVertical = computed(() => orientation.value === 'vertical');
</script>

<template>
  <StepperDescription
    v-slot="slotProps"
    v-bind="forwarded"
    :class="
      cn(
        'hidden text-12 text-gray-400 md:inline',
        isVertical ? 'text-left' : 'w-[100px]',
        props.class
      )
    ">
    <slot v-bind="slotProps" />
  </StepperDescription>
</template>
