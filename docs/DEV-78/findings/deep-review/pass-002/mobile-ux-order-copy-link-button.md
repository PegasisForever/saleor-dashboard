---
agent: step-7-deep-mobile-ux-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: pass
---

## Summary

Mobile UX review of the order copy-link button feature (pass-2 loop-back diff) found no blockers. Production app was unreachable (`localhost:9000` connection refused); Storybook TopNav-context stories were exercised at 320×568, 375×812, and 390×844 with touch emulation. Tap copies successfully update aria-label and icon state, action buttons remain visible without horizontal overflow, and placement matches PRD (copy → metadata → menu). Three non-blocking warnings remain around inherited clipboard failure UX, screen-reader announcement patterns, and Storybook/production title layout parity.

## Findings

### F-001 [WARNING] Mobile clipboard denial leaves button visually unchanged

- Location: `src/hooks/useClipboard.ts:23-25` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:12-20`)
- Description: When `navigator.clipboard.writeText` rejects on mobile (permission denied, insecure context, embedded WebView), the hook logs to console only. The icon-only copy button shows no error state, toast, or label change—identical to idle. Mobile users are more likely to hit clipboard permission failures than desktop users.
- Evidence:
  ```typescript
  .catch(() => {
    console.warn("Failed to use clipboard, ensure browser permission is enabled.");
  });
  ```
  `OrderCopyLinkButtonView` only toggles between `messages.copyOrderLink` and `messages.orderLinkCopied`; no failure branch exists (`OrderCopyLinkButtonView.tsx:20-34`). Contrast: `useClipboardCopy` in extensions surfaces a notifier on failure.
- Suggested fix: Either extend `useClipboard` with optional error callback/notifier, or handle rejection in `OrderCopyLinkButton` with a transient error label or toast. Out-of-scope hook fix is tracked separately (DEV-83); at minimum document mobile limitation.

### F-002 [WARNING] Copied success not announced via live region on mobile screen readers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx:20-33`
- Description: Success feedback mutates the button's in-place `aria-label` from "Copy order link" to "Order link copied". On iOS VoiceOver and Android TalkBack, changing an existing control's label often does not trigger a new announcement; users may not hear confirmation after tap.
- Evidence: No `aria-live`, `role="status"`, or off-screen live region in the component. Chrome a11y snapshot confirms label updates in the tree after tap (`button "Order link copied"`), but that is not equivalent to a polite live-region announcement on mobile AT.
- Suggested fix: Add a visually hidden `aria-live="polite"` element that receives "Order link copied" on success, or use macaw-ui notifier pattern consistent with other copy flows.

### F-003 [WARNING] Mobile layout walkthrough used simplified TopNav title, not production Title composite

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:48` vs `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210` + `Title.tsx:42-63`
- Description: Storybook TopNav decorator uses `title="Order #42"` (single-line string). Production passes `<Title order={order} />`—a flex layout with order number, status pill, and created date. TopNav applies ellipsis only to a string `title` tooltip (`Root.tsx:61-66`); the composite ReactNode may not shrink as predictably on narrow viewports when three icon buttons compete for width.
- Evidence: Chrome at 320×568 on Storybook showed `horizontalOverflow=false`, buttons at x=151/203/255 within 320px width, title truncated to "Order #42". Production Title structure (`Title.tsx:43-52`) includes a non-ellipsis status pill. No mobile viewport story or test covers the real Title + channel picker + copy + metadata + menu cluster.
- Suggested fix: Add a Storybook story (or Playwright mobile viewport test) that renders the real `Title` component with a long localized status label at 320px to validate TopNav crowding on production-like content.
