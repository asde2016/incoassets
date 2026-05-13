export function useIconService() {
  const { GET, POST, DELETE } = useApi();

  return {
    searchIcons: (params: IconListRequest) =>
      GET('/icons', IconListResponseSchema, {
        query: {
          q: params.q || undefined,
          deleted: params.deleted,
          offset: params.offset,
          limit: params.limit,
        },
        skipLoading: true
      }),
    createIcon: (data: CreateIconRequest) => POST('/icons', IconResponseSchema, data),
    softDeleteIcon: (id: number, data: DeleteIconRequest) =>
      DELETE(`/icons/${id}`, OkResponseSchema, data, { skipLoading: true }),
    restoreIcon: (id: number) => POST(`/icons/${id}/restore`, OkResponseSchema, null, { skipLoading: true }),
    suggestMeta: (data: SuggestMetaRequest) =>
      POST('/icons/suggest-meta', SuggestMetaResponseSchema, data, { skipLoading: true, skipToast: true }),
    buildPrompt: (data: BuildPromptRequest) =>
      POST('/icons/build-prompt', BuildPromptResponseSchema, data, { skipLoading: true, skipToast: true }),
    convertPngToSvg: (file: File, baseHex: string, strokeHex?: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('baseHex', baseHex);
      if (strokeHex) form.append('strokeHex', strokeHex);
      return POST('/icons/png-to-svg', PngToSvgResponseSchema, form, { skipToast: true });
    },
  };
}
