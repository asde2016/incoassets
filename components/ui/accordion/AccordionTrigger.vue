<script setup lang="ts">
import type { AccordionTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { AccordionHeader, AccordionTrigger } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="
        cn(
          'flex flex-1 items-center justify-between py-4 text-18 font-medium transition-all data-[state=open]:text-primary [&[data-state=open]>i]:-rotate-180',
          props.class
        )
      ">
      <slot />
      <slot name="icon">
        <i
          v-if="!props.class?.includes('no-child')"
          class="material-icons transition-transform duration-200">
          keyboard_arrow_down
        </i>
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
