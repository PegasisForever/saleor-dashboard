# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage
  └── TopNav
        ├── OrderCopyLinkButton  ← new (container)
        │     ├── useClipboard()           (src/hooks/useClipboard.ts)
        │     ├── OrderCopyLinkButtonContent (presentational)
        │     ├── ClipboardCopyIcon        (src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx)
        │     └── messages.ts              (copyOrderLink / orderLinkCopied)
        ├── metadata Button (existing)
        └── TopNav.Menu (existing)
```

On click, `OrderCopyLinkButton` calls `copy(url ?? window.location.href)`. The optional `url` prop defaults to `window.location.href` in production; Storybook/tests may override it. The `useClipboard` hook manages the 2-second `copied` boolean; `ClipboardCopyIcon` renders Copy/Check based on that flag. Labels come from react-intl messages keyed off the same `copied` state.

Hover/focus/active Storybook stories render production `OrderCopyLinkButtonContent` inside story-only `OrderCopyLinkButtonStoryPreview` with Macaw CSS variables in `OrderCopyLinkButton.stories.module.css` — no preview props in production files.

## Data model

No schema, GraphQL, or persistence changes. Clipboard payload is the current browser URL string.

## API conventions

N/A — browser Clipboard API only (`navigator.clipboard.writeText`). Failure handled inside `useClipboard` (console.warn, no thrown error to caller).

## Affected components

- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button; accepts `copied`, `disabled`, `onCopy`
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wiring `useClipboard` to `OrderCopyLinkButtonContent`; optional `url?: string` for Storybook/tests
- File: `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings `messages.copyOrderLink`, `messages.orderLinkCopied`
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper for hover/focus/active token snapshots
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw CSS variable overrides for interaction states
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state coverage stories (preview-driven hover/focus/active) + TopNav composition story
- File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `<OrderCopyLinkButton />` in TopNav before metadata button
- File: `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — add optional `size` and `strokeWidth` props (backward-compatible defaults)

## Dependencies

No new packages.

## Risks

| Risk                                                      | Mitigation                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Clipboard API unavailable (non-HTTPS, denied permission)  | Existing `useClipboard` logs warning; button stays in default state — document in QA checklist     |
| `window.location.href` includes sensitive query params    | Acceptable — user explicitly copies current view; same as manual address-bar copy                  |
| Message ID lint (`formatjs/enforce-id`)                   | Run `pnpm run extract-messages` during integration to normalize hash IDs                           |
| Story play functions may not settle before static capture | Use story-only preview + Macaw CSS variables; verify each interaction story in published Storybook |
| Missing unit test for `OrderCopyLinkButton`               | Add test in integration pass mirroring `CopyableText.test.tsx` pattern                             |
