<template>
  <div
    class="group relative flex aspect-square cursor-pointer flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 opacity-70 grayscale transition hover:-translate-y-2 hover:border-primary hover:opacity-100 hover:grayscale-0 hover:shadow-down"
    role="button"
    tabindex="0"
    :title="icon.deletedReason || icon.name"
    :aria-label="`${icon.name} 상세 보기`"
    @click="detailOpen = true"
    @keydown="onCardKeydown">
    <span class="absolute left-8 top-8 inline-flex items-center gap-2 rounded bg-gray-700/80 px-6 py-2 text-10 text-white">
      <i class="material-icons text-12">delete</i> 삭제됨
    </span>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-b from-transparent to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
    <div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
      <button
        type="button"
        data-test="icon-action-restore"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-primary hover:text-white disabled:opacity-50"
        :aria-label="`${icon.name} 복구`"
        title="복구"
        :disabled="restoring"
        @click.stop="onRestore">
        <i class="material-icons text-16">restore_from_trash</i>
      </button>
      <button
        type="button"
        data-test="icon-action-copy"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} SVG 복사`"
        title="SVG 복사"
        @click.stop="onCopy">
        <i class="material-icons text-16">content_copy</i>
      </button>
      <button
        type="button"
        data-test="icon-action-download"
        class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        :aria-label="`${icon.name} 다운로드`"
        title="다운로드"
        @click.stop="onDownload">
        <i class="material-icons text-16">file_download</i>
      </button>
    </div>
    <div class="flex flex-1 items-center justify-center text-gray-800" v-html="previewSvg" />
    <div class="w-full truncate text-center text-12 text-gray-500">{{ icon.name }}</div>
  </div>
  <IconDetailDialog :icon="icon" :preview-svg="previewSvg" v-model:open="detailOpen" />
</template>

<script setup lang="ts">
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';

const props = defineProps<{ icon: IconResponse }>();
const c = useCustomizeStore();
const iconStore = useIconStore();

const state = computed<CustomizeState>(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => applyCustomize(props.icon.svg, state.value));
const detailOpen = ref(false);
const restoring = ref(false);

async function onCopy() {
  const ok = await copyToClipboard(previewSvg.value);
  if (ok) {
    toast.success('SVG를 복사했습니다.');
  } else {
    toast.error('복사에 실패했습니다.');
  }
}

function onDownload() {
  downloadSvg(props.icon.slug, previewSvg.value);
}

async function onRestore() {
  if (restoring.value) return;
  restoring.value = true;
  try {
    await iconStore.restore(props.icon.id);
  } finally {
    restoring.value = false;
  }
}

function onCardKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    detailOpen.value = true;
  }
}
</script>
