<script setup lang="ts">
import type { RadioGroupRootEmits, RadioGroupRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { RadioGroupRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<
  RadioGroupRootProps & {
    class?: HTMLAttributes['class'];
    invalid?: boolean;
    invalidMessage?: string;
    size?: 'sm' | 'md' | 'lg';
  }
>();

provide(
  'radio-invalid',
  computed(() => props.invalid)
);

provide(
  'radio-size',
  computed(() => props.size)
);

const emits = defineEmits<RadioGroupRootEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <RadioGroupRoot :class="cn('grid', props.class)" v-bind="forwarded">
    <slot />
    <p
      v-if="props.invalid && props.invalidMessage"
      :class="
        cn('text-sm text-danger', {
          'mt-[-4px] pl-[20px] text-12': size === 'sm',
          'pl-[26px]': !size || size === 'md',
          'pl-[32px]': size === 'lg',
        })
      ">
      {{ props.invalidMessage }}
    </p>
  </RadioGroupRoot>
</template>
