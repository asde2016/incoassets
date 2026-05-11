<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  invalidMessage?: string;
}>();

provide(
  'checkbox-invalid',
  computed(() => props.invalid)
);

provide(
  'checkbox-size',
  computed(() => props.size)
);
</script>

<template>
  <div :class="cn('flex flex-col gap-x-8', props.class)">
    <div
      :class="
        cn('flex', {
          'gap-[6px]': size === 'sm',
          'gap-[8px]': !size || size === 'md',
          'gap-[10px]': size === 'lg',
        })
      ">
      <div
        :class="
          cn('flex h-[1lh] shrink-0 items-center', {
            'mt-[-1px]': size === 'sm',
            'mt-[2px]': size === 'lg',
          })
        ">
        <slot name="checkbox" :invalid="props.invalid" />
      </div>
      <div
        :class="
          cn({
            'text-14': size === 'sm',
            'text-16': !size || size === 'md',
            'text-18': size === 'lg',
          })
        ">
        <slot />
      </div>
    </div>
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
  </div>
</template>
