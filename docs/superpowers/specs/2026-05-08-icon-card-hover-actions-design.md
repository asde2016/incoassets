# Icon Card Hover Actions & Detail Modal — Design

Date: 2026-05-08
Status: Draft

## Problem

Currently, clicking an icon card in the search/result grid immediately downloads the icon as SVG. The card has no preview-only state, and the only on-hover affordance is a small × delete button in the top-right corner. This couples the card's "primary" gesture to a single, irreversible action and leaves no room for adjacent actions like copy or inspecting metadata.

## Goal

Make the card a passive preview by default. On hover, expose four actions in the bottom-right of the card: **Download**, **Copy**, **Detail**, **Delete**. The Detail action opens a modal that shows a larger preview of the customized SVG plus the icon's metadata.

## Non-goals

- Keyboard shortcuts for hover actions.
- Showing the raw SVG source or technical metadata (viewBox, byte size) inside the detail modal.
- In-modal action buttons (Download/Copy/Delete from inside the dialog).
- A new clipboard utility module — the single call site can use `navigator.clipboard.writeText` directly.

## Affected Files

- [components/IconCard.vue](../../../components/IconCard.vue) — modify
- [components/IconDetailDialog.vue](../../../components/IconDetailDialog.vue) — new
- No changes to [stores/search.ts](../../../stores/search.ts), [utils/download.ts](../../../utils/download.ts), or [utils/svg/transform.ts](../../../utils/svg/transform.ts).

## Design

### IconCard.vue changes

**Replace card-click semantics:**

- Old: clicking the card triggered an immediate download via `onCardClick`.
- New: clicking the card opens the detail dialog (`detailOpen = true`). Keyboard activation (Enter/Space) does the same via `onCardKeydown`.
- Keep `cursor-pointer`, `role="button"`, `tabindex="0"`, and an `aria-label` reflecting the new action (`상세 보기`).
- Keep `hover:-translate-y-2 hover:border-primary hover:shadow-down` for hover feedback.

**Remove:**

- The old top-right × delete button. Its behavior moves into the new bottom-right toolbar.
- The old `onCardClick` function (replaced by inline `@click="detailOpen = true"`).

**Add — hover gradient backdrop (bottom-right corner only):**

- A non-interactive gradient overlay covering only the bottom-right quadrant of the card, fading from a soft gray at the bottom-right corner to transparent toward the center. Visible only on hover, animated via `transition-opacity`.
- `<div class="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 rounded-br-lg bg-gradient-to-tl from-gray-200/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />`
- Quadrant-only placement keeps the gradient out of the bottom-center name label.
- `pointer-events-none` so it never intercepts clicks meant for the toolbar buttons that sit on top of it.

**Add — bottom-right hover action toolbar:**

- Container: `<div class="absolute right-8 bottom-8 hidden gap-4 group-hover:flex">` — horizontal row, hidden by default, revealed when the card is hovered (the existing `group` class on the root supports this). Sits visually on top of the gradient backdrop.
- Three buttons in left-to-right order, each a circular icon button (`h-24 w-24 rounded-full bg-white/95 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900`), using material-icons (already used elsewhere in this project — see [components/PromptGuidePanel.vue:26](../../../components/PromptGuidePanel.vue#L26)):
  1. `file_download` — `aria-label="다운로드"`, `title="다운로드"`. Calls `downloadSvg(props.icon.slug, previewSvg.value)`.
  2. `content_copy` — `aria-label="SVG 복사"`, `title="SVG 복사"`. Calls `navigator.clipboard.writeText(previewSvg.value)`. On success, no UI feedback for v1 (toast is out of scope).
  3. `delete` — keeps the existing red-on-hover treatment from the current × button (`hover:bg-danger hover:text-white`). Calls the existing `onDelete($event)`.
- Each button uses `@click.stop` so the click does not bubble up to the card root and re-open the detail dialog.
- Material-icon usage matches existing pattern: `<i class="material-icons text-16">file_download</i>`.
- The "open detail" affordance is the card body itself (clicking anywhere outside the toolbar/gradient region), not a dedicated button.

**Add — detail modal state:**

- `const detailOpen = ref(false)` in `<script setup>`.
- Render `<IconDetailDialog v-model:open="detailOpen" :icon="icon" :preview-svg="previewSvg" />` inside the card's template (it teleports out via the underlying dialog primitive, so position inside the card is fine).

### IconDetailDialog.vue (new)

Uses [components/ui/dialog](../../../components/ui/dialog/) (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`).

**Props:**

```ts
defineProps<{ open: boolean; icon: IconDto; previewSvg: string }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();
```

Bind `:open="open"` and `@update:open="$emit('update:open', $event)"` so `v-model:open` works on the parent.

**Layout (top → bottom inside `DialogContent`):**

1. Header: `DialogTitle` = `icon.name`, `DialogDescription` = `icon.slug` (mono, gray).
2. Preview block: square, `size-240 max-w-full` (≈240×240), `rounded-lg bg-gray-50 border border-gray-200`, `flex items-center justify-center`, with `group relative overflow-hidden` so it can host a hover-revealed in-modal toolbar (mirrors the card's UX): a soft gradient backdrop in the bottom-right quadrant + 2 circular icon buttons (`file_download`, `content_copy`) at `absolute bottom-8 right-8`, hidden until the user hovers the preview area. The buttons reuse the same `downloadSvg` / `navigator.clipboard.writeText` calls. They do NOT need `@click.stop` since the dialog content has no parent click handler. Inside the preview, `<div v-html="previewSvg" class="[&>svg]:size-full [&>svg]:max-h-full" />` — so the customized SVG fills the box but never overflows.
3. Meta list: 2-column grid (`grid grid-cols-[80px_1fr] gap-x-12 gap-y-8 text-13`) with these rows:
   - Category — plain text
   - Description — plain text, `text-gray-700`, allow wrap
   - Tags — wrapped flex of badge chips. Use the existing `Badge` component from [components/ui/badge](../../../components/ui/badge/).
   - Created — formatted from `icon.createdAt` as `YYYY-MM-DD HH:MM:SS` using local time, via a small helper that pads each component with `String#padStart(2, '0')`. If `new Date(icon.createdAt)` is invalid, fall back to the raw `createdAt` string.

No footer; the dialog's built-in close (×) is enough.

### Data flow

```
IconCard
 ├─ computed previewSvg = applyCustomize(icon.svg, customizeState)
 ├─ ref detailOpen = false
 ├─ hover toolbar (group-hover:flex)
 │    ├─ download → downloadSvg(slug, previewSvg)
 │    ├─ copy     → navigator.clipboard.writeText(previewSvg)
 │    ├─ detail   → detailOpen = true
 │    └─ delete   → existing onDelete
 └─ <IconDetailDialog v-model:open="detailOpen" :icon :preview-svg />
```

`previewSvg` is already reactive on customize state, so the modal preview updates live if the user changes the customize panel while the dialog is open. That is the desired behavior.

### Accessibility

- Each toolbar button has both `aria-label` and `title` (Korean, matching existing copy).
- Root card no longer has `role="button"` or `tabindex`, since clicking it does nothing — removing the role is correct, not a regression.
- The four toolbar buttons are reachable by tab once the user hovers; this matches existing behavior of the prior × button. Full keyboard-only flow without hover is out of scope for v1.

### Edge cases

- `navigator.clipboard` is undefined in non-secure contexts (rare in dev, but possible). For v1, swallow the rejection silently — there is no toast system wired up, and adding one is out of scope.
- Icon SVG from the API is trusted server-side content (same origin, no user-authored markup). `v-html` on `previewSvg` is consistent with the existing pattern at [components/IconCard.vue:56](../../../components/IconCard.vue#L56).

## Out of Scope (deferred)

- Toast/snackbar feedback after copy.
- Keyboard shortcut bindings (e.g., `D` for download when card focused).
- Modal-internal action buttons.
- SVG source view inside the modal.
- Bulk select/operations across multiple cards.
