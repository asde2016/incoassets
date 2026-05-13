<template>
  <div>
    <div class="grid grid-cols-2 gap-12 md:grid-cols-4 xl:grid-cols-6">
      <IconCreateCard v-if="search.mode === 'active'" @open="emit('openCreate')" />
      <template v-if="showSkeleton">
        <div
          :key="`skeleton-${n}`"
          v-for="n in search.mode === 'active' ? 17 : 18"
          class="flex aspect-square flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12">
          <div class="flex flex-1 items-center justify-center">
            <div class="h-64 w-96 rounded-md skeleton-wave" />
          </div>
          <div class="h-12 w-3/5 rounded skeleton-wave" />
        </div>
      </template>
      <template v-if="!showSkeleton">
        <template v-if="search.mode === 'active'">
          <IconCard :key="icon.id" v-for="icon in search.items" :icon="icon" />
        </template>
        <template v-else>
          <IconDeletedCard :key="icon.id" v-for="icon in search.items" :icon="icon" />
        </template>
      </template>
    </div>

    <div
      v-if="
        search.mode === 'deleted' &&
        !showSkeleton &&
        !search.loading &&
        search.items.length === 0
      "
      class="flex flex-col items-center justify-center py-80 text-center text-gray-400">
      <i class="material-icons mb-12" style="font-size: 56px">delete_outline</i>
      <p class="text-15 font-medium text-gray-600">휴지통이 비어 있습니다</p>
      <p class="mt-4 text-13 text-gray-400">삭제한 아이콘이 여기에 표시됩니다.</p>
    </div>

    <div ref="sentinel" class="h-32" />
    <div
      v-if="search.loading && search.items.length > 0"
      class="py-16 text-center text-13 text-gray-500">
      로딩 중…
    </div>
  </div>
</template>

<script setup lang="ts">
const SKELETON_MIN_MS = 300;

const emit = defineEmits<{ openCreate: [] }>();
const search = useIconStore();
const sentinel = ref<HTMLElement | null>(null);
const initialLoad = ref(search.items.length === 0);
const showSkeleton = ref(search.items.length === 0);

let observer: IntersectionObserver | null = null;
let skeletonStartedAt = showSkeleton.value ? Date.now() : 0;
let skeletonHideTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => search.loading && search.items.length === 0,
  (active) => {
    if (active) {
      if (skeletonHideTimer) {
        clearTimeout(skeletonHideTimer);
        skeletonHideTimer = null;
      }
      showSkeleton.value = true;
      skeletonStartedAt = Date.now();
      return;
    }
    if (!showSkeleton.value) return;
    const remaining = SKELETON_MIN_MS - (Date.now() - skeletonStartedAt);
    if (remaining <= 0) {
      showSkeleton.value = false;
    } else {
      skeletonHideTimer = setTimeout(() => {
        showSkeleton.value = false;
        skeletonHideTimer = null;
      }, remaining);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  observer = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting && search.hasMore && !search.loading) {
          search.loadMore();
        }
      }
    },
    { rootMargin: '200px' }
  );
  if (sentinel.value) observer.observe(sentinel.value);

  try {
    await search.setQuery(search.q);
  } finally {
    initialLoad.value = false;
  }
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  if (skeletonHideTimer) clearTimeout(skeletonHideTimer);
});
</script>
