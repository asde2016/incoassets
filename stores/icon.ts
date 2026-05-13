const PAGE_SIZE = 60;

export const useIconStore = defineStore('icon', {
  state: () => ({
    q: '',
    mode: 'active' as SearchMode,
    items: [] as IconResponse[],
    offset: 0,
    hasMore: true,
    loading: false,
  }),

  actions: {
    async fetchPage(reset: boolean) {
      if (this.loading) return;
      if (!reset && !this.hasMore) return;
      this.loading = true;
      if (reset) {
        this.items = [];
        this.offset = 0;
      }
      try {
        const iconService = useIconService();
        const res = await iconService.searchIcons({
          q: this.q,
          deleted: this.mode === 'deleted' ? 'true' : undefined,
          offset: reset ? 0 : this.offset,
          limit: PAGE_SIZE,
        });
        if (!res) return;
        if (reset) {
          this.items = res.items;
          this.offset = res.items.length;
        } else {
          this.items = [...this.items, ...res.items];
          this.offset = this.items.length;
        }
        this.hasMore = res.hasMore;
      } finally {
        this.loading = false;
      }
    },

    async setQuery(next: string) {
      this.q = next;
      this.offset = 0;
      this.hasMore = true;
      await this.fetchPage(true);
    },

    async setMode(next: SearchMode) {
      if (this.mode === next) return;
      this.mode = next;
      this.offset = 0;
      this.hasMore = true;
      await this.fetchPage(true);
    },

    async loadMore() {
      await this.fetchPage(false);
    },

    add(item: IconResponse) {
      this.items = [item, ...this.items];
      this.offset += 1;
    },

    remove(id: number) {
      this.items = this.items.filter(i => i.id !== id);
      this.offset = Math.max(0, this.offset - 1);
    },

    async softDelete(id: number, reason: string): Promise<boolean> {
      try {
        const iconService = useIconService();
        const r = await iconService.softDeleteIcon(id, { reason });
        if (r) this.remove(id);
        return !!r;
      } catch {
        return false;
      }
    },

    async restore(id: number): Promise<boolean> {
      try {
        const iconService = useIconService();
        const r = await iconService.restoreIcon(id);
        if (r) this.remove(id);
        return !!r;
      } catch {
        return false;
      }
    },

    // Ollama 메타 추론 — 미실행/502 시 silent fallback 으로 null 반환.
    async suggestMeta(data: SuggestMetaRequest): Promise<SuggestMetaResponse | null> {
      try {
        const iconService = useIconService();
        const r = await iconService.suggestMeta(data);
        return r ?? null;
      } catch {
        return null;
      }
    },

    async buildPrompt(data: BuildPromptRequest): Promise<BuildPromptResponse | null> {
      try {
        const iconService = useIconService();
        const r = await iconService.buildPrompt(data);
        return r ?? null;
      } catch {
        return null;
      }
    },

    async convertPngToSvg(
      file: File,
      baseHex: string,
      strokeHex?: string
    ): Promise<PngToSvgResponse | null> {
      try {
        const iconService = useIconService();
        const r = await iconService.convertPngToSvg(file, baseHex, strokeHex);
        return r ?? null;
      } catch {
        return null;
      }
    },

    // 아이콘 등록 — 성공 시 로컬 items 에도 즉시 prepend 하여 UI 갱신.
    async createIcon(data: CreateIconRequest): Promise<IconResponse | null> {
      try {
        const iconService = useIconService();
        const row = await iconService.createIcon(data);
        if (row) this.add(row);
        return row ?? null;
      } catch {
        return null;
      }
    },
  },
});
