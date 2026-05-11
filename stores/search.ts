// stores/search.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type IconDto = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  tags: string[];
  svg: string;
  createdAt: string;
  deletedAt: string | null;
  deletedReason: string | null;
};

export type SearchMode = 'active' | 'deleted';

const PAGE_SIZE = 60;

export const useSearch = defineStore('search', () => {
  const q = ref<string>('');
  const mode = ref<SearchMode>('active');
  const items = ref<IconDto[]>([]);
  const offset = ref<number>(0);
  const hasMore = ref<boolean>(true);
  const loading = ref<boolean>(false);
  let abortCtrl: AbortController | null = null;

  async function fetchPage(reset: boolean) {
    if (loading.value) return;
    if (!reset && !hasMore.value) return;
    loading.value = true;
    if (reset) {
      items.value = [];
      offset.value = 0;
    }
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const url = new URL('/api/icons', window.location.origin);
    if (q.value) url.searchParams.set('q', q.value);
    if (mode.value === 'deleted') url.searchParams.set('deleted', 'true');
    url.searchParams.set('offset', String(reset ? 0 : offset.value));
    url.searchParams.set('limit', String(PAGE_SIZE));
    try {
      const res = await fetch(url, { signal: abortCtrl.signal });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = (await res.json()) as { items: IconDto[]; hasMore: boolean };
      if (reset) {
        items.value = json.items;
        offset.value = json.items.length;
      } else {
        items.value = [...items.value, ...json.items];
        offset.value = items.value.length;
      }
      hasMore.value = json.hasMore;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error('[search] fetch error', e);
      }
    } finally {
      loading.value = false;
    }
  }

  async function setQuery(next: string) {
    q.value = next;
    offset.value = 0;
    hasMore.value = true;
    await fetchPage(true);
  }

  async function setMode(next: SearchMode) {
    if (mode.value === next) return;
    mode.value = next;
    offset.value = 0;
    hasMore.value = true;
    await fetchPage(true);
  }

  async function loadMore() {
    await fetchPage(false);
  }

  function add(item: IconDto) {
    items.value = [item, ...items.value];
    offset.value += 1;
  }

  function remove(id: number) {
    items.value = items.value.filter(i => i.id !== id);
    offset.value = Math.max(0, offset.value - 1);
  }

  async function softDelete(id: number, reason: string): Promise<boolean> {
    const res = await fetch(`/api/icons/${id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return false;
    remove(id);
    return true;
  }

  async function restore(id: number): Promise<boolean> {
    const res = await fetch(`/api/icons/${id}/restore`, { method: 'POST' });
    if (!res.ok) return false;
    remove(id);
    return true;
  }

  return {
    q,
    mode,
    items,
    offset,
    hasMore,
    loading,
    setQuery,
    setMode,
    loadMore,
    add,
    remove,
    softDelete,
    restore,
  };
});
