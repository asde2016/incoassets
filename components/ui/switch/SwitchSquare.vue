<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/shadcn';

interface SwitchSquareOption {
  value: string;
  label: string;
  icon?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: [SwitchSquareOption, SwitchSquareOption];
    class?: HTMLAttributes['class'];
  }>(),
  {}
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const select = (value: string) => {
  console.log('SwitchSquare value', value);
  emit('update:modelValue', value);
};
</script>

<template>
  <div
    :class="
      cn(
        'inline-flex gap-[2px] overflow-hidden rounded-md border border-primary p-[5px]',
        props.class
      )
    ">
    <button
      :key="option.value"
      v-for="option in options"
      type="button"
      :class="
        cn(
          'flex items-center gap-[6px] rounded px-12 py-6 text-14 font-medium transition-colors',
          modelValue === option.value ? 'bg-primary text-white' : 'hover:bg-primary/10 text-primary'
        )
      "
      @click="select(option.value)">
      <i v-if="option.icon" class="material-icons text-[18px]">{{ option.icon }}</i>
      {{ option.label }}
    </button>
  </div>
</template>
