<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RadioGroupItem, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes['class']; size?: 'sm' | 'md' | 'lg' }
>();

const injectedSize = inject<Ref<'sm' | 'md' | 'lg' | undefined>>('radio-size', ref(undefined));
const resolvedSize = computed(() => props.size ?? injectedSize.value);

const delegatedProps = reactiveOmit(props, 'class', 'size');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'inline-flex cursor-pointer items-center justify-center rounded-sm border border-border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white',
        {
          'h-40 px-14 text-14': resolvedSize === 'sm',
          'h-48 px-16 text-16': !resolvedSize || resolvedSize === 'md',
          'h-52 px-18 text-18': resolvedSize === 'lg',
        },
        props.class
      )
    ">
    <slot />
  </RadioGroupItem>
</template>
