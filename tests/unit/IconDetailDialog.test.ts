import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import IconDetailDialog from '~/components/IconDetailDialog.vue';
import type { IconDto } from '~/stores/search';

vi.mock('~/utils/download', () => ({
  downloadSvg: vi.fn(),
}));

import { downloadSvg } from '~/utils/download';

const sampleIcon: IconDto = {
  id: 1,
  name: 'Cloud',
  slug: 'cloud',
  category: 'weather',
  description: 'A friendly cloud icon',
  tags: ['sky', 'weather'],
  svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  createdAt: '2026-05-08T10:00:00.000Z',
};

const previewSvg = '<svg data-test="rendered-svg" viewBox="0 0 24 24"></svg>';

describe('IconDetailDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title, slug, category, description, tags, and preview when open', async () => {
    const wrapper = mount(IconDetailDialog, {
      props: { open: true, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });

    await nextTick();
    await nextTick();

    const root = document.body;
    expect(root.textContent).toContain('Cloud');
    expect(root.textContent).toContain('cloud');
    expect(root.textContent).toContain('weather');
    expect(root.textContent).toContain('A friendly cloud icon');
    expect(root.textContent).toContain('sky');
    expect(root.textContent).toContain('weather');
    expect(root.querySelector('[data-test="rendered-svg"]')).not.toBeNull();

    wrapper.unmount();
  });

  it('formats createdAt as YYYY-MM-DD HH:MM:SS', async () => {
    const wrapper = mount(IconDetailDialog, {
      props: { open: true, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });

    await nextTick();
    await nextTick();

    expect(document.body.textContent ?? '').toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

    wrapper.unmount();
  });

  it('does not render dialog content when closed', () => {
    mount(IconDetailDialog, {
      props: { open: false, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });

    expect(document.body.querySelector('[data-test="rendered-svg"]')).toBeNull();
  });

  it('modal download button calls downloadSvg with slug and previewSvg', async () => {
    const wrapper = mount(IconDetailDialog, {
      props: { open: true, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    const btn = document.body.querySelector('[data-test="modal-action-download"]') as HTMLElement;
    expect(btn).not.toBeNull();
    btn.click();

    expect(downloadSvg).toHaveBeenCalledWith('cloud', previewSvg);

    wrapper.unmount();
  });

  it('modal copy button writes previewSvg to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const wrapper = mount(IconDetailDialog, {
      props: { open: true, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    const btn = document.body.querySelector('[data-test="modal-action-copy"]') as HTMLElement;
    expect(btn).not.toBeNull();
    btn.click();

    expect(writeText).toHaveBeenCalledWith(previewSvg);

    wrapper.unmount();
    vi.unstubAllGlobals();
  });
});
