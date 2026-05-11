<script setup lang="ts">
import VueSelect from 'vue-select';
import { cn } from '@/utils/shadcn';
import { useAttrs, computed, ref } from 'vue';

interface Option {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const passAttrs = computed(() => {
  const { id, class: _, ...rest } = attrs;
  return rest;
});

const modelValue = defineModel<string | number | Option | Option[] | null>();

const {
  options = [],
  placeholder = '선택하세요',
  multiple = false,
  clearable = true,
  searchable = true,
  disabled = false,
  label = 'label',
  filterable = true,
  reduce,
  noOptionText,
  invalid,
  invalidMessage,
} = defineProps<{
  options?: Option[] | string[];
  placeholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
  reduce?: (option: Option) => string | number;
  class?: string;
  noOptionText?: string;
  invalid?: boolean;
  invalidMessage?: string;
  filterable?: boolean;
}>();

const isLoading = ref(false);

const emits = defineEmits<{
  (e: 'search', search: string, toggleLoading: (val: boolean) => void): void;
}>();

function onSearch(s: string, t: (v: boolean) => void) {
  const wrappedToggle = (val: boolean) => {
    isLoading.value = val;
  };
  emits('search', s, wrappedToggle);
}

function dropdownShouldOpen(vs: { noDrop: boolean; open: boolean; mutableLoading: boolean }) {
  return vs.noDrop ? false : vs.open;
}
</script>

<!-- VueSelect 에 seleted-count="true" attribute를 추가하면 선택 항목을 갯수로 표시 -->
<template :id="$attrs.id">
  <VueSelect
    v-bind="passAttrs"
    :uid="$attrs.id"
    :options="options"
    :placeholder="placeholder"
    :multiple="multiple"
    :clearable="clearable"
    :searchable="searchable"
    :disabled="disabled"
    :label="label"
    :reduce="reduce"
    :filterable="filterable"
    :deselect-from-dropdown="multiple"
    :close-on-select="!multiple"
    :class="cn('v-select', invalid && 'is-invalid', $props.class)"
    :dropdown-should-open="dropdownShouldOpen"
    @search="onSearch"
    v-model="modelValue">
    <template #search="{ attributes, events }">
      <input class="vs__search" v-bind="attributes" v-on="events" />
    </template>

    <template #no-options="{ search }">
      <template v-if="isLoading">
        <li class="vs__loading-spinner">
          <span class="vs__loading-icon" />
        </li>
      </template>
      <slot v-else name="no-options" :search="search">
        <span class="text-sm text-muted-foreground">
          "{{ search }}"{{ noOptionText ?? '에 해당하는 항목이 없습니다.' }}
        </span>
      </slot>
    </template>
    <template v-if="$slots.option" #option="option">
      <slot name="option" v-bind="option" />
    </template>
    <template v-if="$slots['selected-option']" #selected-option="option">
      <slot name="selected-option" v-bind="option" />
    </template>
    <template #list-footer>
      <li v-if="isLoading && options.length > 0" class="vs__loading-spinner">
        <span class="vs__loading-icon" />
      </li>
      <slot name="list-footer" />
    </template>
  </VueSelect>
  <p v-if="invalid && invalidMessage" class="mt-4 text-sm text-danger">
    {{ invalidMessage }}
  </p>
</template>
