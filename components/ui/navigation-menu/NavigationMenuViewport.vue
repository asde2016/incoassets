<script setup lang="ts">
import type { NavigationMenuViewportProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { NavigationMenuViewport, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/shadcn';

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <div class="absolute left-0 top-full flex justify-center">
    <NavigationMenuViewport
      v-bind="forwardedProps"
      :class="
        cn(
          `origin-top-center relative left-[var(--reka-navigation-menu-viewport-left)] mt-[8px] h-[--reka-navigation-menu-viewport-height] overflow-hidden rounded-md bg-popover text-popover-foreground shadow data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-auto`,
          props.class
        )
      " />
  </div>
</template>

<!-- 애니메이션 클래스 
data-[state=open]:animate-in data-[state=closed]:animate-out
-->

<!-- 말풍선 클래스 
before:content-[''] before:absolute before:top-[-20px] before:left-1/2 before:-translate-x-1/2 before:border-l-[10px] before:border-r-[10px] before:border-t-[10px] before:border-b-[10px] before:border-l-transparent before:border-r-transparent before:border-t-transparent before:border-b-white
-->
