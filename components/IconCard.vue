<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCustomize } from '~/stores/customize';
import { useSearch, type IconDto } from '~/stores/search';
import { applyCustomize, type CustomizeState } from '~/utils/svg/transform';
import { downloadSvg } from '~/utils/download';
import IconDetailDialog from '~/components/IconDetailDialog.vue';
import { AlertDialog } from '~/components/ui/dialog';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';

const props = defineProps<{ icon: IconDto }>();
const c = useCustomize();
const search = useSearch();

const state = computed<CustomizeState>(() => ({
  size: c.size,
  strokeWidth: c.strokeWidth,
  mode: c.mode,
  color: c.color,
}));

const previewSvg = computed(() => applyCustomize(props.icon.svg, state.value));

const detailOpen = ref(false);
const deleteOpen = ref(false);
const reason = ref('');
const submitting = ref(false);

watch(deleteOpen, (open) => {
  if (!open) reason.value = '';
});

function onCopy() {
  void navigator.clipboard?.writeText(previewSvg.value);
}

function onDownload() {
  downloadSvg(props.icon.slug, previewSvg.value);
}

function onCardKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    detailOpen.value = true;
  }
}

async function confirmDelete() {
  const trimmed = reason.value.trim();
  if (!trimmed || submitting.value) return;
  submitting.value = true;
  try {
    const ok = await search.softDelete(props.icon.id, trimmed);
    if (ok) {
      deleteOpen.value = false;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="group relative flex aspect-square cursor-pointer flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 transition hover:-translate-y-2 hover:border-primary hover:shadow-down"
    role="button"
    tabindex="0"
    :title="icon.name"
    :aria-label="`${icon.name} 상세 보기`"
    @click="detailOpen = true"
    @keydown="onCardKeydown">
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-b from-transparent to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
    <div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
      <AlertDialog variant="danger" msg="삭제 사유를 입력해 주세요" v-model:open="deleteOpen">
        <template #trigger>
          <button
            type="button"
            data-test="icon-action-delete"
            class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-danger hover:text-white"
            :aria-label="`${icon.name} 삭제`"
            title="삭제"
            @click.stop>
            <i class="material-icons-outlined text-16">delete</i>
          </button>
        </template>
        <template #title>"{{ icon.name }}"을(를) 삭제하시겠습니까?</template>
        <p class="mb-8 text-13 text-gray-500">삭제된 아이콘은 휴지통에서 복구할 수 있습니다.</p>
        <Textarea
          data-test="delete-reason"
          rows="3"
          placeholder="삭제 사유 (필수)"
          v-model="reason" />
        <template #footer>
          <Button
            data-test="delete-confirm"
            variant="danger"
            size="sm"
            :disabled="!reason.trim() || submitting"
            :click-close="false"
            @click="confirmDelete">
            삭제
          </Button>
          <Button variant="outline" size="sm">취소</Button>
        </template>
      </AlertDialog>
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
