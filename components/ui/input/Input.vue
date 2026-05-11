<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import type { InputVariants } from '.';
import { inputVariants } from '.';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes['class'];
  size?: InputVariants['size'];
  inputStyle?: InputVariants['inputStyle'];
  clear?: boolean;
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

const isFocused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const slots = useSlots();

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  inputRef,
});
</script>

<template>
  <div class="w-full" :class="props.clear && 'relative'">
    <div class="relative">
      <input
        ref="inputRef"
        v-bind="$attrs"
        class="appearance-none [&::-webkit-search-cancel-button]:appearance-none"
        :class="
          cn(
            inputVariants({ size, inputStyle }),
            props.invalid && '!border-danger focus-visible:ring-danger-ring',
            props.clear && isFocused && modelValue && 'pr-36',
            props.class
          )
        "
        @focus="isFocused = true"
        @blur="isFocused = false"
        v-model="modelValue" />
      <slot name="icon" />
    </div>
    <button
      v-if="props.clear && isFocused && modelValue"
      type="button"
      class="absolute right-12 top-[50%] flex translate-y-[-50%] items-center justify-center"
      @mousedown.prevent="modelValue = ''">
      <i class="material-icons text-14 text-secondary">cancel</i>
    </button>
    <p v-if="props.invalid && props.invalidMessage" class="mt-4 text-sm text-danger">
      {{ props.invalidMessage }}
    </p>
  </div>
</template>
