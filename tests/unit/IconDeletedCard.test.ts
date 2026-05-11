import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import IconDeletedCard from '~/components/IconDeletedCard.vue';
import type { IconDto } from '~/stores/search';
import { downloadSvg } from '~/utils/download';

vi.mock('~/utils/download', () => ({ downloadSvg: vi.fn() }));

const sampleDeleted: IconDto = {
  id: 7,
  name: 'Cloud',
  slug: 'cloud',
  category: 'weather',
  description: 'A cloud',
  tags: ['sky'],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  createdAt: '2026-05-08T10:00:00.000Z',
  deletedAt: '2026-05-08T11:00:00.000Z',
  deletedReason: '중복',
};

describe('IconDeletedCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('restore button calls /api/icons/:id/restore via store', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-restore"]').trigger('click');
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/icons/7/restore', { method: 'POST' });
  });

  it('download button calls downloadSvg with the slug', async () => {
    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });
    await wrapper.get('[data-test="icon-action-download"]').trigger('click');
    expect(downloadSvg).toHaveBeenCalledWith('cloud', expect.stringContaining('<svg'));
  });

  it('copy button writes svg to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const wrapper = mount(IconDeletedCard, {
      props: { icon: sampleDeleted },
      global: { stubs: { IconDetailDialog: true } },
    });
    await wrapper.get('[data-test="icon-action-copy"]').trigger('click');
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
