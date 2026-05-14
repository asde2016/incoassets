<template>
  <Container>
    <section class="mb-32 text-center">
      <h1 class="text-32 font-semibold text-gray-900">사내 SVG 자산 라이브러리</h1>
      <p class="mt-8 text-14 text-gray-500">
        필요한 아이콘은 찾아 다운로드하고, 없는 건 만들어 사내에 공유해보세요.
      </p>
    </section>

    <section class="mb-24">
      <Input
        ref="searchInput"
        type="search"
        placeholder='아이콘 검색…  ("/"로 포커스)'
        class="pl-48 pr-16"
        v-model="inputQ">
        <template #icon>
          <i
            class="material-icons pointer-events-none absolute left-16 top-[50%] translate-y-[-50%] text-20 text-gray-400">
            search
          </i>
        </template>
      </Input>
    </section>

    <section class="grid grid-cols-1 gap-24 lg:grid-cols-[1fr_280px]">
      <div>
        <IconGrid @open-create="onOpenCreate" />
      </div>
      <div>
        <CustomizePanel />
      </div>
    </section>

    <UploadModal :open="uploadOpen" :keyword="search.q" @close="uploadOpen = false" />
  </Container>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const search = useIconStore();

function readQ(query: typeof route.query): string {
  return typeof query.q === 'string' ? query.q : '';
}
function readMode(query: typeof route.query): SearchMode {
  return query.mode === 'deleted' ? 'deleted' : 'active';
}

const initialQ = readQ(route.query);
const initialMode = readMode(route.query);
if (search.q !== initialQ) search.q = initialQ;
if (search.mode !== initialMode) search.mode = initialMode;

const inputQ = ref(initialQ);
const uploadOpen = ref(false);
const searchInput = ref<{ focus: () => void } | null>(null);
let debounce: ReturnType<typeof setTimeout> | null = null;

watch(inputQ, next => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    search.setQuery(next);
  }, 500);
});

watch([() => search.q, () => search.mode], ([q, mode]) => {
  const next: Record<string, string> = {};
  if (q) next.q = q;
  if (mode === 'deleted') next.mode = 'deleted';
  const cur = route.query;
  if ((cur.q ?? '') === q && (cur.mode ?? 'active') === mode) return;
  router.replace({ query: next });
});

watch(
  () => route.query,
  (q) => {
    const newQ = readQ(q);
    const newMode = readMode(q);
    if (search.q !== newQ) {
      inputQ.value = newQ;
      search.setQuery(newQ);
    }
    if (search.mode !== newMode) search.setMode(newMode);
  }
);

function onOpenCreate() {
  uploadOpen.value = true;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !uploadOpen.value) {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName ?? '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});
</script>
