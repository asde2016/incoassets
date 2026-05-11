import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import IconCard from '~/components/IconCard.vue';
import type { IconDto } from '~/stores/search';

import { downloadSvg } from '~/utils/download';

vi.mock('~/utils/download', () => ({
  downloadSvg: vi.fn(),
}));

const sampleIcon: IconDto = {
  id: 1,
  name: 'Cloud',
  slug: 'cloud',
  category: 'weather',
  description: 'A cloud',
  tags: ['sky', 'weather'],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  createdAt: '2026-05-08T10:00:00.000Z',
};

describe('IconCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('does not download when the card root is clicked', async () => {
    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.trigger('click');

    expect(downloadSvg).not.toHaveBeenCalled();
  });

  it('download button calls downloadSvg with slug and applied svg', async () => {
    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-download"]').trigger('click');

    expect(downloadSvg).toHaveBeenCalledTimes(1);
    expect(downloadSvg).toHaveBeenCalledWith('cloud', expect.stringContaining('<svg'));
  });

  it('copy button writes the applied svg to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-copy"]').trigger('click');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('<svg');
  });

  it('clicking the card opens the detail dialog', async () => {
    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: { template: '<div data-test="detail-stub" :data-open="open"></div>', props: ['open', 'icon', 'previewSvg'] } } },
    });

    expect(wrapper.get('[data-test="detail-stub"]').attributes('data-open')).toBe('false');

    await wrapper.find('div').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-test="detail-stub"]').attributes('data-open')).toBe('true');
  });

  it('does not have a detail action button anymore', () => {
    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    expect(wrapper.find('[data-test="icon-action-detail"]').exists()).toBe(false);
  });

  it('delete button opens AlertDialog and calls softDelete with reason', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      attachTo: document.body,
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-delete"]').trigger('click');
    await nextTick();

    const textarea = document.querySelector(
      '[data-test="delete-reason"]'
    ) as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();

    const confirmBtn = document.querySelector(
      '[data-test="delete-confirm"]'
    ) as HTMLButtonElement | null;
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn!.disabled).toBe(true);

    textarea!.value = '품질 이슈';
    textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(confirmBtn!.disabled).toBe(false);

    confirmBtn!.click();
    await nextTick();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/icons/1');
    expect(init?.method).toBe('DELETE');
    expect(JSON.parse(init?.body as string)).toEqual({ reason: '품질 이슈' });

    wrapper.unmount();
  });
});
