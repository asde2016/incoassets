# Icon Card Hover Actions & Detail Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the icon card's click-to-download behavior with a hover-revealed bottom-right toolbar (Download / Copy / Detail / Delete) and a centered detail modal that shows a large preview plus metadata.

**Architecture:** Modify [components/IconCard.vue](../../../components/IconCard.vue) to remove the click/keyboard handlers and the existing top-right delete button, then add a hover-only action toolbar (`group-hover:flex`) using `material-icons`. Add a sibling component `IconDetailDialog.vue` that wraps the project's shadcn-vue Dialog primitive and renders the customized SVG at ~240px plus IconDto metadata.

**Tech Stack:** Nuxt 3 + Vue 3 (`<script setup>`), Pinia, Tailwind, reka-ui Dialog (via `components/ui/dialog`), existing `material-icons` font usage, `@vue/test-utils` + `vitest` (`happy-dom` env).

**Spec:** [docs/superpowers/specs/2026-05-08-icon-card-hover-actions-design.md](../specs/2026-05-08-icon-card-hover-actions-design.md)

**Project convention — git:** The user manages git themselves in this repo. Each task ends with a "stop checkpoint" instead of a commit step. Do NOT run `git add`, `git commit`, or any other git mutation. Pause and let the user commit when they choose.

---

## File Plan

| File | Change | Responsibility |
|------|--------|----------------|
| [components/IconCard.vue](../../../components/IconCard.vue) | modify | Render preview, hover toolbar (4 buttons), open detail dialog |
| [components/IconDetailDialog.vue](../../../components/IconDetailDialog.vue) | create | Dialog with large preview + metadata grid |
| [tests/unit/IconCard.test.ts](../../../tests/unit/IconCard.test.ts) | create | Verify card no longer downloads on click; hover toolbar buttons fire correct handlers |
| [tests/unit/IconDetailDialog.test.ts](../../../tests/unit/IconDetailDialog.test.ts) | create | Verify dialog renders metadata fields and applied SVG |

---

## Task 1: Test — card click no longer downloads

**Files:**
- Test: `tests/unit/IconCard.test.ts` (create)

This pins down the core spec change: the card root must not trigger a download.

- [ ] **Step 1: Create the test file with a failing test**

Path: `tests/unit/IconCard.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import IconCard from '~/components/IconCard.vue';
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
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm vitest run tests/unit/IconCard.test.ts`

Expected: FAIL — current `IconCard.vue` calls `downloadSvg` from `onCardClick` on root click, so `downloadSvg` will have been called once.

- [ ] **Step 3: Stop checkpoint — wait for user**

Do not edit `IconCard.vue` yet. Hand control back so the user can review the failing test. Subsequent tasks make it pass.

---

## Task 2: Implement — strip card click handlers

**Files:**
- Modify: [components/IconCard.vue](../../../components/IconCard.vue)

- [ ] **Step 1: Remove `onCardClick` and `onCardKeydown` from `<script setup>`**

In `components/IconCard.vue`, delete lines 21–30 (the two function declarations). The imports `downloadSvg` (line 6) and `applyCustomize` (line 5) stay — they will be reused by Task 3's toolbar buttons.

After this step the `<script setup>` block ends at the `onDelete` function (currently line 32+).

- [ ] **Step 2: Strip click/keyboard/role attributes from the root `<div>`**

Replace the root opening tag (currently lines 41–48):

```html
<div
  class="group relative flex aspect-square cursor-pointer flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 transition hover:-translate-y-2 hover:border-primary hover:shadow-down"
  role="button"
  tabindex="0"
  :title="icon.name"
  :aria-label="`${icon.name} 다운로드`"
  @click="onCardClick"
  @keydown="onCardKeydown">
```

With:

```html
<div
  class="group relative flex aspect-square flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 transition hover:-translate-y-2 hover:border-primary hover:shadow-down"
  :title="icon.name">
```

Note: `cursor-pointer` is removed (the card is no longer clickable), as are `role="button"`, `tabindex="0"`, `:aria-label`, `@click`, and `@keydown`. The `group` class stays — it powers `group-hover` on the toolbar in Task 3.

- [ ] **Step 3: Run the Task 1 test and confirm it now passes**

Run: `pnpm vitest run tests/unit/IconCard.test.ts`

Expected: PASS — clicking the card no longer calls `downloadSvg`.

- [ ] **Step 4: Stop checkpoint**

Pause for user review.

---

## Task 3: Test — hover toolbar fires correct actions

**Files:**
- Modify: `tests/unit/IconCard.test.ts`

- [ ] **Step 1: Append new tests covering each toolbar button**

Add inside the existing `describe('IconCard', ...)` block in `tests/unit/IconCard.test.ts`:

```typescript
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
    Object.assign(navigator, { clipboard: { writeText } });

    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-copy"]').trigger('click');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('<svg');
  });

  it('detail button opens the detail dialog', async () => {
    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: { template: '<div data-test="detail-stub" :data-open="open"></div>', props: ['open', 'icon', 'previewSvg'] } } },
    });

    expect(wrapper.get('[data-test="detail-stub"]').attributes('data-open')).toBe('false');

    await wrapper.get('[data-test="icon-action-detail"]').trigger('click');

    expect(wrapper.get('[data-test="detail-stub"]').attributes('data-open')).toBe('true');
  });

  it('delete button calls the DELETE endpoint after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(IconCard, {
      props: { icon: sampleIcon },
      global: { stubs: { IconDetailDialog: true } },
    });

    await wrapper.get('[data-test="icon-action-delete"]').trigger('click');
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/icons/1', { method: 'DELETE' });
  });
```

- [ ] **Step 2: Run the new tests and confirm they fail**

Run: `pnpm vitest run tests/unit/IconCard.test.ts`

Expected: FAIL on the four new tests — the toolbar elements with `data-test="icon-action-*"` don't exist yet.

- [ ] **Step 3: Stop checkpoint**

Pause for user review.

---

## Task 4: Implement — hover toolbar in IconCard.vue

**Files:**
- Modify: [components/IconCard.vue](../../../components/IconCard.vue)

- [ ] **Step 1: Add `detailOpen` ref and update imports in `<script setup>`**

At the top of `<script setup lang="ts">`, replace:

```ts
import { computed } from 'vue';
```

With:

```ts
import { computed, ref } from 'vue';
import IconDetailDialog from '~/components/IconDetailDialog.vue';
```

After the existing `previewSvg` computed, add:

```ts
const detailOpen = ref(false);

function onCopy() {
  void navigator.clipboard?.writeText(previewSvg.value);
}

function onDownload() {
  downloadSvg(props.icon.slug, previewSvg.value);
}
```

Leave `onDelete` as-is.

- [ ] **Step 2: Replace the existing top-right delete button with the bottom-right toolbar**

In the `<template>`, find the current delete button (currently lines 49–55):

```html
<button
  type="button"
  class="absolute right-4 top-4 z-10 hidden h-24 w-24 items-center justify-center rounded-md bg-white/95 text-gray-400 transition hover:bg-danger hover:text-white group-hover:flex"
  :aria-label="`${icon.name} 삭제`"
  @click="onDelete($event)">
  ×
</button>
```

Replace it with the four-button toolbar:

```html
<div class="absolute bottom-8 right-8 z-10 hidden gap-4 group-hover:flex">
  <button
    type="button"
    data-test="icon-action-download"
    class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
    :aria-label="`${icon.name} 다운로드`"
    title="다운로드"
    @click.stop="onDownload">
    <i class="material-icons text-16">file_download</i>
  </button>
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
    data-test="icon-action-detail"
    class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
    :aria-label="`${icon.name} 상세 보기`"
    title="상세 보기"
    @click.stop="detailOpen = true">
    <i class="material-icons text-16">info</i>
  </button>
  <button
    type="button"
    data-test="icon-action-delete"
    class="flex h-24 w-24 items-center justify-center rounded-full bg-white/95 text-gray-400 shadow-sm transition hover:bg-danger hover:text-white"
    :aria-label="`${icon.name} 삭제`"
    title="삭제"
    @click.stop="onDelete($event)">
    <i class="material-icons text-16">delete</i>
  </button>
</div>
```

- [ ] **Step 3: Mount the detail dialog**

Just after the closing `</div>` of the card root (before the file's closing `</template>`), add:

```html
  <IconDetailDialog v-model:open="detailOpen" :icon="icon" :preview-svg="previewSvg" />
```

The dialog is rendered as a sibling of the card root, *outside* the card `<div>`. To do this, change the template's outer structure to a fragment:

```html
<template>
  <div
    class="group relative flex aspect-square flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-12 transition hover:-translate-y-2 hover:border-primary hover:shadow-down"
    :title="icon.name">
    <!-- toolbar (from Step 2) -->
    <div class="flex flex-1 items-center justify-center text-gray-800" v-html="previewSvg" />
    <div class="w-full truncate text-center text-12 text-gray-500">{{ icon.name }}</div>
  </div>
  <IconDetailDialog v-model:open="detailOpen" :icon="icon" :preview-svg="previewSvg" />
</template>
```

(Vue 3 templates allow multiple root nodes — fine here.)

- [ ] **Step 4: Run the IconCard tests and confirm they pass**

Run: `pnpm vitest run tests/unit/IconCard.test.ts`

Expected: All five tests in the file PASS.

If `IconDetailDialog` import errors out because the file doesn't exist yet, create a temporary placeholder at `components/IconDetailDialog.vue`:

```vue
<script setup lang="ts">
defineProps<{ open: boolean; icon: unknown; previewSvg: string }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();
</script>

<template>
  <div />
</template>
```

Task 5 replaces this placeholder with the real dialog. The placeholder is enough to keep the IconCard tests green.

- [ ] **Step 5: Stop checkpoint**

Pause for user review.

---

## Addendum (added 2026-05-08 mid-execution, after Tasks 3+4 completed)

Two refinements requested by the user; folded into the Tasks 5+6 dispatch:

1. **Hover gradient backdrop on the card.** Add a non-interactive soft-gray gradient overlay covering only the card's bottom-right quadrant, fading from the corner toward center, visible on hover with `transition-opacity`. Keeps the bottom-center name label clear. Insert as a sibling of the toolbar inside the card root:

   ```html
   <div class="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 rounded-br-lg bg-gradient-to-tl from-gray-200/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
   ```

2. **Created date format `YYYY-MM-DD HH:MM:SS`.** Replace the `toLocaleString('ko-KR')` formatter in `IconDetailDialog.vue` with a small zero-padded local-time formatter:

   ```ts
   const createdAt = computed(() => {
     const d = new Date(props.icon.createdAt);
     if (Number.isNaN(d.getTime())) return props.icon.createdAt;
     const pad = (n: number) => n.toString().padStart(2, '0');
     return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
   });
   ```

   Test: add an assertion that the rendered text contains `'2026-05-08 19:00:00'` (the local-time conversion of `'2026-05-08T10:00:00.000Z'` in KST/UTC+9; if the test runs in a different TZ this assertion will need adjusting — consider freezing TZ via `process.env.TZ = 'Asia/Seoul'` in the test setup).

---

## Task 5: Test — IconDetailDialog renders metadata and preview

**Files:**
- Test: `tests/unit/IconDetailDialog.test.ts` (create)

- [ ] **Step 1: Write the failing dialog test**

Path: `tests/unit/IconDetailDialog.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IconDetailDialog from '~/components/IconDetailDialog.vue';
import type { IconDto } from '~/stores/search';

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
  it('renders title, slug, category, description, tags, and preview when open', () => {
    const wrapper = mount(IconDetailDialog, {
      props: { open: true, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });

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

  it('does not render dialog content when closed', () => {
    mount(IconDetailDialog, {
      props: { open: false, icon: sampleIcon, previewSvg },
      attachTo: document.body,
    });

    expect(document.body.querySelector('[data-test="rendered-svg"]')).toBeNull();
  });
});
```

(`reka-ui`'s `DialogContent` portals into `document.body`, which is why the assertions look at `document.body` rather than the wrapper.)

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm vitest run tests/unit/IconDetailDialog.test.ts`

Expected: FAIL — the placeholder dialog from Task 4 renders only an empty `<div />`, so none of the metadata or the preview SVG is present.

- [ ] **Step 3: Stop checkpoint**

Pause for user review.

---

## Task 6: Implement — IconDetailDialog.vue

**Files:**
- Modify: [components/IconDetailDialog.vue](../../../components/IconDetailDialog.vue) (replace placeholder)

- [ ] **Step 1: Replace the placeholder with the full implementation**

Replace the entire contents of `components/IconDetailDialog.vue` with:

```vue
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

const props = defineProps<{ open: boolean; icon: IconDto; previewSvg: string }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const createdAt = computed(() => {
  const d = new Date(props.icon.createdAt);
  return Number.isNaN(d.getTime()) ? props.icon.createdAt : d.toLocaleString('ko-KR');
});
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
          class="mx-auto flex size-240 max-w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
          <div class="size-full p-16 [&>svg]:max-h-full [&>svg]:size-full" v-html="previewSvg" />
        </div>

        <dl class="grid grid-cols-[80px_1fr] gap-x-12 gap-y-8 text-13">
          <dt class="text-gray-500">Category</dt>
          <dd class="text-gray-800">{{ icon.category || '-' }}</dd>

          <dt class="text-gray-500">Description</dt>
          <dd class="whitespace-pre-wrap text-gray-700">{{ icon.description || '-' }}</dd>

          <dt class="text-gray-500">Tags</dt>
          <dd class="flex flex-wrap gap-4">
            <Badge
              v-for="tag in icon.tags"
              :key="tag"
              variant="outline-primary">
              {{ tag }}
            </Badge>
            <span v-if="!icon.tags?.length" class="text-gray-400">-</span>
          </dd>

          <dt class="text-gray-500">Created</dt>
          <dd class="text-gray-700">{{ createdAt }}</dd>
        </dl>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Run all unit tests for these components and confirm they pass**

Run: `pnpm vitest run tests/unit/IconCard.test.ts tests/unit/IconDetailDialog.test.ts`

Expected: All tests in both files PASS (5 in IconCard, 2 in IconDetailDialog = 7 total).

If `DialogContent`'s `size` prop is required, fall back to `<DialogContent>` without size (the existing usage in [components/UploadModal.vue:161](../../../components/UploadModal.vue#L161) passes `size="xl"`, but it is optional based on the component definition).

- [ ] **Step 3: Stop checkpoint**

Pause for user review.

---

## Task 7: Manual smoke test

**Files:** none

This is a non-automated verification step. UI behavior (hover transitions, dialog portal, clipboard) is hard to fully cover via unit tests.

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Walk through the user flows in a browser**

Open the app, navigate to a page that renders the icon grid. Verify each of:

1. Hovering an icon card shows the four-button toolbar in the bottom-right with no layout shift.
2. Clicking the card body (away from buttons) does NOT trigger a download.
3. Click `file_download` icon → browser downloads `<slug>.svg` containing the customized SVG.
4. Click `content_copy` icon → paste into a text editor; the clipboard contains the customized SVG markup.
5. Click `info` icon → modal opens with the icon name as title, slug under it, a 240px preview (matching the customize panel's color/stroke/mode), category, description, tag chips, and a Korean-formatted timestamp.
6. While the modal is open, change a slider/color in the customize panel — the modal preview updates live.
7. Close the modal via Esc, ×, or backdrop click.
8. Click `delete` icon → confirm dialog appears; on accept, the card is removed from the grid (existing behavior, regression check).
9. Tab focus order: hovering brings buttons into reach; tabbing through them reaches all four in left-to-right order.

- [ ] **Step 2: Stop checkpoint**

If any step fails, log the failure and pause. Otherwise, hand control back so the user can commit.

---

## Plan Self-Review

**Spec coverage:**
- Remove card click → Tasks 1, 2 ✓
- Remove keyboard / role / aria-label download → Task 2 ✓
- Remove top-right × delete → Task 4 (Step 2 replaces it) ✓
- Hover toolbar with 4 material-icons buttons (Download / Copy / Detail / Delete) → Tasks 3, 4 ✓
- Each button uses `@click.stop`, `aria-label`, `title` → Task 4 ✓
- `detailOpen` ref + IconDetailDialog mount → Task 4 ✓
- Dialog uses `ui/dialog` primitive → Task 6 ✓
- Larger preview (~240px, contained, never overflows) → Task 6 ✓
- Metadata grid: name (header), slug (description), category, description, tags via Badge, createdAt formatted → Task 6 ✓
- `previewSvg` updates live via reactive customize state → guaranteed by passing `previewSvg` as a prop bound to the parent's computed; smoke step 6 confirms ✓
- Clipboard error swallowed silently → Task 4 (`void navigator.clipboard?.writeText(...)`) ✓
- `v-html` on trusted SVG matches existing pattern → Task 4 (matches `IconCard.vue:56`) ✓
- No new clipboard utility module → confirmed (inline in `onCopy`) ✓
- No keyboard shortcuts, no in-modal actions, no SVG source view, no toast → out of scope, not added ✓

**Placeholder scan:** No "TBD", "TODO", "implement later", or vague directives found. Each step contains the actual code to write.

**Type consistency:**
- `IconDto` imported from `~/stores/search` in both new files — matches existing usage.
- `previewSvg: string` prop name consistent across IconCard (Task 4), placeholder (Task 4 Step 4), and IconDetailDialog (Task 6).
- `update:open` event name consistent across emit declaration and `v-model:open` binding.
- `data-test` attribute names (`icon-action-download/copy/detail/delete`) match between Task 3 tests and Task 4 implementation.

No issues found.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-icon-card-hover-actions.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
