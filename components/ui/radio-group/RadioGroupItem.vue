<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';
import { radioGroupItemVariants } from './index';

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes['class']; size?: 'sm' | 'md' | 'lg' }
>();

const injectedInvalid = inject('radio-invalid', ref(false));
const isInvalid = computed(() => (injectedInvalid as Ref<boolean>).value);

const injectedSize = inject<Ref<'sm' | 'md' | 'lg'>>('radio-size', ref(undefined));
const resolvedSize = computed(() => props.size ?? injectedSize.value);

const delegatedProps = reactiveOmit(props, 'class', 'size');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        radioGroupItemVariants({ size: resolvedSize }),
        isInvalid && 'border-danger data-[state=unchecked]:focus-visible:ring-danger-ring',
        props.class
      )
    ">
    <RadioGroupIndicator class="grid place-content-center text-current">
      <i
        :class="
          cn('material-icons text-primary', {
            'text-8': resolvedSize === 'sm',
            'text-10': !resolvedSize || resolvedSize === 'md',
            'text-12': resolvedSize === 'lg',
          })
        ">
        circle
      </i>
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
