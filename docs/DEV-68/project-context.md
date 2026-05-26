# Project Context

## Tech stack

- **React** 18.3.1, **TypeScript** 5.8.3, **Vite** 7.3.2, **Node** >=24, **pnpm** 10.28.2
- **Apollo Client** 3.4.17 for GraphQL; **React Router** v5 for routing
- **UI:** `@saleor/macaw-ui-next` (primary), legacy `@saleor/macaw-ui` / Material UI v4 in older views
- **Icons:** `lucide-react` (Macaw icons deprecated)
- **i18n:** `react-intl` with `defineMessages` catalogs
- **Storybook** 10.2.x on Vite (`pnpm run storybook`, `pnpm run build-storybook`)
- **Testing:** Jest + Testing Library; Playwright for E2E

## Conventions

- Feature modules under `src/<domain>/` with `views/`, `components/`, `queries.ts`, `mutations.ts`, `urls.ts`, `fixtures.ts`, `messages.ts`
- Path alias `@dashboard/*` → `src/*`
- **Named exports only**; no new barrel `index.ts` files
- **CSS Modules** (`.module.css`) for complex styling; Macaw `Box` sprinkle props for simple layout
- Co-located `ComponentName.stories.tsx` using CSF3 (`Meta`, `StoryObj`)
- Story titles: `"Orders/<Component>"` for order feature components
- All user-facing strings via `react-intl`; reuse `src/intl.ts` where possible
- `data-test-id` for test hooks (kebab-case values)

## Existing patterns

- **Clipboard:** `useClipboard()` from `@dashboard/hooks/useClipboard` returns `[copied, copy]`; auto-resets after 2s
- **Copy icon toggle:** `ClipboardCopyIcon` in `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` (CopyIcon ↔ CheckIcon)
- **Copy buttons:** `Button variant="tertiary" size="small"` with hover-reveal (inline text) or `secondary` icon-only (TopNav actions)
- **Toasts:** `sonner` via `useNotifier()` (used in extensions/gift cards; orders copy flows rely on icon toggle only)
- **Order URLs:** `orderPath(id)` / `orderUrl(id, params)` in `src/orders/urls.ts` — relative paths; absolute URLs combine `window.location.origin` + `getAppMountUri()` + path (see `useRowAnchor`, auth redirect helpers)
- **TopNav:** `src/components/AppLayout/TopNav/`; order details page renders metadata `Code` button + `TopNav.Menu` in `OrderDetailsPage.tsx`

## Prior architectural decisions

- Dashboard is a static SPA GraphQL client — no backend logic in this repo
- GraphQL types are generated (`pnpm run generate`); never hand-edit `*.generated.ts`
- New components should use strict TypeScript (no `@ts-strict-ignore`)
- New UI uses Macaw UI Next + Lucide; Storybook required for new components
- Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`

## Out of scope

- Rolling custom clipboard utilities (use `useClipboard`)
- New icon wrapper components when `ClipboardCopyIcon` exists
- Backend/schema changes for this feature
- Legacy `@saleor/macaw-ui` or Material UI in new code
- Barrel exports, default exports, inline user-facing strings
