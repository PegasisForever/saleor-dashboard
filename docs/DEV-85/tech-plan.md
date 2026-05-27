# Tech Plan: Copy order link button in order details TopNav

## Architecture overview

```
OrderDetailsPage
  └── TopNav
        ├── OrderCopyLinkButton  ← new
        │     ├── useClipboard()           (src/hooks/useClipboard.ts)
        │     ├── ClipboardCopyIcon        (src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx)
        │     └── messages.ts              (copyOrderLink / orderLinkCopied)
        ├── metadata Button (existing)
        └── TopNav.Menu (existing)
```

On click, `OrderCopyLinkButton` calls `copy(window.location.href)`. The `useClipboard` hook manages the 2-second `copied` boolean; `ClipboardCopyIcon` renders Copy/Check based on that flag. Labels come from react-intl messages keyed off the same `copied` state.

## Data model

No schema, GraphQL, or persistence changes. Clipboard payload is the current browser URL string.

## API conventions

N/A — browser Clipboard API only (`navigator.clipboard.writeText`). Failure handled inside `useClipboard` (console.warn, no thrown error to caller).

## Affected components

- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button; accepts `copied`, `disabled`, and optional `interactionPreview` for Storybook state snapshots
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wiring `useClipboard` to `OrderCopyLinkButtonContent`
- File: `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n strings `messages.copyOrderLink`, `messages.orderLinkCopied`
- File: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state coverage stories + TopNav composition story
- File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `<OrderCopyLinkButton />` in TopNav before metadata button
- File: `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — add optional `size` and `strokeWidth` props (backward-compatible defaults)

## Dependencies

No new packages.

## Risks

| Risk                                                     | Mitigation                                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Clipboard API unavailable (non-HTTPS, denied permission) | Existing `useClipboard` logs warning; button stays in default state — document in QA checklist |
| `window.location.href` includes sensitive query params   | Acceptable — user explicitly copies current view; same as manual address-bar copy              |
| Message ID lint (`formatjs/enforce-id`)                  | Run `pnpm run extract-messages` during integration to normalize hash IDs                       |
| Story vs production styling divergence                   | No story-only CSS modules; component uses Macaw `Button` tokens directly                       |
| Missing unit test for `OrderCopyLinkButton`              | Add test in integration pass mirroring `CopyableText.test.tsx` pattern                         |
