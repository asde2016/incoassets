<script setup lang="ts">
import type { DropdownMenuCheckboxItemEmits, DropdownMenuCheckboxItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuCheckboxItem, useForwardPropsEmits } from 'reka-ui';

const props = defineProps<DropdownMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<DropdownMenuCheckboxItemEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DropdownMenuCheckboxItem
    v-bind="forwarded"
    :class="
      cn(
        'relative flex select-none items-center gap-8 rounded-sm px-8 py-6 text-14 outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class
      )
    ">
    <!-- #indicator 슬롯: 기본값은 Checkbox, 외부에서 교체 가능 -->
    <slot name="indicator">
      <Checkbox :model-value="props.modelValue" class="pointer-events-none" />
    </slot>
    <slot />
  </DropdownMenuCheckboxItem>
</template>
