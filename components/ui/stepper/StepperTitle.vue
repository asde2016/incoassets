<script lang="ts" setup>
import type { StepperTitleProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';

import { StepperTitle, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<StepperTitleProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <StepperTitle
    v-bind="forwarded"
    :class="
      cn(
        'hidden whitespace-nowrap text-13 font-medium transition-all md:inline',
        'text-gray-500',
        'group-data-[state=active]:font-semibold group-data-[state=active]:text-gray-900',
        'group-data-[state=completed]:text-success',
        props.class
      )
    ">
    <slot />
  </StepperTitle>
</template>
