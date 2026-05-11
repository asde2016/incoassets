<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes['class'];
  invalid?: boolean;
  invalidMessage?: string;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <div class="w-full">
    <div
      :class="
        cn(
          'w-full rounded-md border border-border bg-white py-[4px] pl-16 pr-[4px] font-normal ring-offset-background focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0',
          props.invalid && 'min-h-[40px] !border-danger focus-within:!ring-danger-ring',
          props.class
        )
      ">
      <textarea
        v-bind="$attrs"
        :class="
          cn(
            'bg-transparentpy-8 block h-[100%] min-h-[30px] w-full resize-none overflow-y-auto py-[4px] placeholder:text-muted-foreground focus:outline-none'
          )
        "
        v-model="modelValue" />
    </div>
    <p v-if="props.invalid && props.invalidMessage" class="mt-4 text-sm text-danger">
      {{ props.invalidMessage }}
    </p>
  </div>
</template>
