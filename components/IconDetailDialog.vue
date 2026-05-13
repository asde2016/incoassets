<script setup lang="ts">
import { computed } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';
import type { IconDto } from '~/stores/search';
import { downloadSvg } from '~/utils/download';

const props = defineProps<{ open: boolean; icon: IconDto; previewSvg: string }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const createdAt = computed(() => formatDate(props.icon.createdAt));
const deletedAt = computed(() =>
  props.icon.deletedAt ? formatDate(props.icon.deletedAt) : ''
);

// 저장된 tags 는 KO + EN 합쳐 단일 배열이라 표시 시 분리.
// 한 글자라도 non-ASCII (코드 > 127) 가 있으면 KO 로 본다 — 한글·일본어 등 CJK 안전 포착.
function hasNonAscii(s: string): boolean {
  return [...s].some((c) => c.charCodeAt(0) > 127);
}
const tagsKo = computed(() => (props.icon.tags ?? []).filter(hasNonAscii));
const tagsEn = computed(() => (props.icon.tags ?? []).filter((t) => !hasNonAscii(t)));

async function onCopy() {
  try {
    await navigator.clipboard?.writeText(props.previewSvg);
  } catch {
    /* clipboard unavailable */
  }
}

function onDownload() {
  downloadSvg(props.icon.slug, props.previewSvg);
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent>
      <template #header>
        <DialogHeader>
          <DialogTitle>{{ icon.name }}</DialogTitle>
          <DialogDescription class="font-mono text-12 text-gray-500">
            {{ icon.slug }}
          </DialogDescription>
        </DialogHeader>
      </template>

      <div class="space-y-20">
        <div
          class="group relative mx-auto flex size-240 max-w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-b from-transparent to-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
            <button
              type="button"
              data-test="modal-action-copy"
              class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
              :aria-label="`${icon.name} SVG 복사`"
              title="SVG 복사"
              @click="onCopy">
              <i class="material-icons text-16">content_copy</i>
            </button>
            <button
              type="button"
              data-test="modal-action-download"
              class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
              :aria-label="`${icon.name} 다운로드`"
              title="다운로드"
              @click="onDownload">
              <i class="material-icons text-16">file_download</i>
            </button>
          </div>
          <div class="size-full p-16 [&>svg]:max-h-full [&>svg]:size-full" v-html="previewSvg" />
        </div>

        <dl class="grid grid-cols-[80px_1fr] gap-x-12 gap-y-8 text-13">
          <dt class="text-gray-500">Category</dt>
          <dd class="text-gray-800">{{ icon.category || '-' }}</dd>

          <dt class="text-gray-500">Description</dt>
          <dd class="whitespace-pre-wrap text-gray-700">{{ icon.description || '-' }}</dd>

          <dt class="text-gray-500">Tags (KO)</dt>
          <dd class="flex flex-wrap gap-4">
            <Badge
              :key="tag"
              v-for="tag in tagsKo"
              variant="outline-primary">
              {{ tag }}
            </Badge>
            <span v-if="!tagsKo.length" class="text-gray-400">-</span>
          </dd>

          <dt class="text-gray-500">Tags (EN)</dt>
          <dd class="flex flex-wrap gap-4">
            <Badge
              :key="tag"
              v-for="tag in tagsEn"
              variant="outline-primary">
              {{ tag }}
            </Badge>
            <span v-if="!tagsEn.length" class="text-gray-400">-</span>
          </dd>

          <dt class="text-gray-500">Created</dt>
          <dd class="text-gray-700">{{ createdAt }}</dd>
        </dl>

        <div
          v-if="icon.deletedAt"
          class="rounded-md border border-danger p-12 text-13">
          <dl class="grid grid-cols-[80px_1fr] gap-x-12 gap-y-8">
            <dt class="text-danger">Reason</dt>
            <dd class="whitespace-pre-wrap text-gray-800">{{ icon.deletedReason || '-' }}</dd>

            <dt class="text-danger">Deleted at</dt>
            <dd class="text-gray-700">{{ deletedAt }}</dd>
          </dl>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
