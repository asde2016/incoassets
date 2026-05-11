<script setup lang="ts">
import { computed, ref } from 'vue';
import { buildPrompt } from '~/composables/promptGuide';

const props = defineProps<{ keyword: string; description?: string }>();

const count = ref<number>(3);
const prompt = computed(() => buildPrompt(props.keyword, props.description, count.value));
const copied = ref(false);

const countOptions = [
  { label: '3개', value: 3 },
  { label: '6개', value: 6 },
];

const reduceCount = (o: { label: string; value: string | number }) => o.value;

async function copy() {
  if (!props.keyword.trim()) {
    toast.error('키워드를 먼저 입력해 주세요.');
    return;
  }
  await navigator.clipboard.writeText(prompt.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

defineExpose({ count });
</script>

<template>
  <div class="flex items-center gap-8">
    <label class="flex items-center gap-8 text-13 text-gray-600">
      결과 개수
      <VueSelect
        :options="countOptions"
        :reduce="reduceCount"
        :clearable="false"
        :searchable="false"
        size="sm"
        class="w-[6rem]"
        v-model="count" />
    </label>
    <button
      type="button"
      class="flex h-40 items-center gap-4 rounded-md border border-gray-200 bg-white px-12 text-12 text-gray-600 transition hover:bg-gray-100"
      @click="copy">
      <template v-if="copied">복사됨</template>
      <template v-else>
        <i class="material-icons -ms-2 text-14">content_copy</i>
        프롬프트 복사
      </template>
    </button>
  </div>
</template>
