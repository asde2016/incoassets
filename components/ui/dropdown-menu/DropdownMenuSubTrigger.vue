<script setup lang="ts">
import type { DropdownMenuSubTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuSubTrigger, useForwardProps } from 'reka-ui';

const props = defineProps<DropdownMenuSubTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuSubTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'flex select-none items-center rounded-md outline-none focus:bg-accent data-[state=open]:bg-accent',
        props.class
      )
    ">
    <slot />
    <i class="material-icons ml-auto">keyboard_arrow_right</i>
    <!--<ChevronRight class="ml-auto h-4 w-4" />-->
  </DropdownMenuSubTrigger>
</template>
