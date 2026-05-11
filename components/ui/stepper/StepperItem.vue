<script lang="ts" setup>
import type { StepperItemProps } from 'reka-ui';
import type { HTMLAttributes, Ref } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { StepperItem, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);

const orientation = inject<Ref<string>>('stepper-orientation', ref('horizontal'));
const isVertical = computed(() => orientation.value === 'vertical');
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    v-bind="forwarded"
    :class="
      cn(
        'group relative flex w-full items-start data-[disabled]:pointer-events-none',
        !isVertical && 'h-full flex-1 justify-center',
        props.class
      )
    ">
    <slot v-bind="slotProps" />
  </StepperItem>
</template>
