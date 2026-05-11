<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuContent, DropdownMenuPortal, useForwardPropsEmits } from 'reka-ui';

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

const props = withDefaults(
  defineProps<
    DropdownMenuContentProps & { class?: HTMLAttributes['class']; position?: Position }
  >(),
  { sideOffset: 4, position: 'bottom-left' }
);
const emits = defineEmits<DropdownMenuContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'position');
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const side = computed(() => (props.position.startsWith('top') ? 'top' : 'bottom'));
const align = computed(() => {
  if (props.position.endsWith('left')) return 'start';
  if (props.position.endsWith('right')) return 'end';
  return 'center';
});
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="forwarded"
      :side="side"
      :align="align"
      :class="
        cn(
          'z-50 max-h-250 min-w-[--reka-dropdown-menu-trigger-width] overflow-y-auto rounded-md border border-border bg-popover p-6 text-popover-foreground shadow-down',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class
        )
      ">
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
