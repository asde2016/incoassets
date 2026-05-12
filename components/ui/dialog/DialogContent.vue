<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui';
import type { HTMLAttributes, FunctionalComponent } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui';
import { inject, useSlots, cloneVNode, h } from 'vue';
import { cn } from '@/utils/shadcn';

const sizeClasses = {
  sm: 'sm:max-w-[312px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[612px]',
  xl: 'sm:max-w-[1216px]',
  '2xl': 'sm:max-w-[1504px]',
} as const;

const props = withDefaults(
  defineProps<
    DialogContentProps & { class?: HTMLAttributes['class']; size?: keyof typeof sizeClasses }
  >(),
  { size: 'md' }
);
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'size');

const closeIcon = inject('dialogCloseIcon', true);
const backdrop = inject('dialogBackdrop', false);

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const slots = useSlots();

const BodySlot: FunctionalComponent = () => {
  const vnodes = slots.default?.() || [];
  if (vnodes.length === 1) {
    return cloneVNode(vnodes[0], {
      class: '',
    });
  }
  return h('div', { class: 'text-danger' }, vnodes);
};
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-24 rounded-lg bg-background p-32 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          sizeClasses[props.size],
          props.class
        )
      "
      @pointer-down-outside="
        e => {
          if (backdrop) e.preventDefault();
        }
      "
      @interact-outside="
        e => {
          if (backdrop) e.preventDefault();
        }
      ">
      <slot name="header" />
      <BodySlot />
      <slot name="footer" />
      <DialogClose
        v-if="closeIcon"
        class="absolute right-32 top-30 rounded-md leading-none opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <i class="material-icons align-text-bottom text-24">close</i>
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
