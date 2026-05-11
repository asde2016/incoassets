<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<
  SwitchRootProps & {
    class?: HTMLAttributes['class'];
    /** @deprecated use modelValue instead */
    checked?: boolean;
  }
>();

const emits = defineEmits<
  SwitchRootEmits & {
    /** @deprecated use update:modelValue instead */
    'update:checked': [value: boolean];
  }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer inline-flex h-18 w-32 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        props.class
      )
    ">
    <SwitchThumb
      :class="
        cn(
          'pointer-events-none block h-14 w-14 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-14'
        )
      ">
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
