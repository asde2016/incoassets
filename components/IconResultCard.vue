<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IconDto } from '~/stores/search';
import { useSearch } from '~/stores/search';
import { useCustomize } from '~/stores/customize';
import { applyCustomize } from '~/utils/svg/transform';
import { validateMeta } from '~/utils/svg/validate';
import type { ResultItem } from '~/utils/svg/validate';

const props = defineProps<{ item: ResultItem; fallbackName: string }>();

const search = useSearch();
const c = useCustomize();

const customize = computed(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => {
  if (!props.item.validation.ok) return '';
  return applyCustomize(props.item.svg, customize.value);
});

type SavedState = 'idle' | 'saving' | 'saved' | 'error';
const savedState = ref<SavedState>('idle');
const errorMessage = ref<string>('');
const copyFlash = ref(false);

const validationErrors = computed(() =>
  props.item.validation.ok ? [] : props.item.validation.errors
);

const validationWarnings = computed(() =>
  props.item.validation.ok ? props.item.validation.warnings : []
);

const hasWarnings = computed(() => validationWarnings.value.length > 0);

const saveLabel = computed(() => {
  switch (savedState.value) {
    case 'saving':
      return '저장 중…';
    case 'saved':
      return '저장됨';
    case 'error':
      return '재시도';
    default:
      return '저장';
  }
});

const saveDisabled = computed(
  () => !props.item.validation.ok || savedState.value === 'saving' || savedState.value === 'saved'
);

const copyLabel = computed(() => (copyFlash.value ? '복사됨' : '복사'));

async function onSave() {
  if (saveDisabled.value) return;
  savedState.value = 'saving';
  errorMessage.value = '';

  const llm = props.item.rawMeta ?? {};
  const v = validateMeta({
    name: llm.name ?? props.fallbackName,
    tags: llm.tags ?? [],
    category: llm.category ?? '',
    description: llm.description ?? '',
  });
  let metaToPost;
  if (v.ok) {
    metaToPost = v.meta;
  } else {
    metaToPost = {
      name: props.fallbackName,
      tags: [],
      category: '',
      description: '',
    };
  }

  try {
    const res = await fetch('/api/icons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: metaToPost.name,
        tags: metaToPost.tags,
        category: metaToPost.category,
        description: metaToPost.description,
        svg: props.item.svg,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
    }
    const saved = (await res.json()) as IconDto;
    search.add(saved);
    savedState.value = 'saved';
  } catch (e: unknown) {
    savedState.value = 'error';
    errorMessage.value = e instanceof Error ? e.message : '저장 실패';
  }
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(props.item.svg);
    copyFlash.value = true;
    setTimeout(() => (copyFlash.value = false), 1500);
  } catch {
    /* clipboard unavailable; ignore silently */
  }
}
</script>

<template>
  <div
    class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
    :class="{ 'opacity-70': !item.validation.ok }">
    <div
      class="relative flex aspect-square items-center justify-center"
      style="
        background-image:
          linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
        background-size: 32px 32px;
      ">
      <div v-if="item.validation.ok" class="text-gray-800" v-html="previewSvg" />
      <div v-else class="px-12 text-center text-12 text-gray-400">미리보기 불가</div>
      <div
        v-if="item.validation.ok && hasWarnings"
        class="absolute right-6 top-6 flex h-22 w-22 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300"
        :title="validationWarnings.join('\n')">
        <i class="material-icons text-14">warning</i>
      </div>
    </div>

    <div class="flex flex-col gap-4 border-t border-gray-200 px-12 py-8">
      <div v-if="!item.validation.ok" class="text-11 text-danger">
        {{ validationErrors[0] ?? 'SVG가 표준에 맞지 않습니다' }}
      </div>
      <div v-if="errorMessage" class="text-11 text-danger">{{ errorMessage }}</div>
      <div class="flex justify-end gap-4">
        <button
          type="button"
          class="rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saveDisabled"
          @click="onSave">
          {{ saveLabel }}
        </button>
        <button
          type="button"
          class="rounded-md border border-gray-200 bg-white px-12 py-4 text-12 text-gray-700 transition hover:bg-gray-100"
          @click="onCopy">
          {{ copyLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
