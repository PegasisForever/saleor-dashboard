# Project Context

## Tech stack

- **Application:** Saleor Dashboard `3.23.5` — TypeScript `5.8.3`, React `18.3.1`, React Router v5, Apollo Client `3.4.17`, GraphQL `16.11.0`
- **Build:** Vite `7.3.2` with `@vitejs/plugin-react-swc`; dev server port `9000`
- **Package manager:** pnpm `10.28.2` on Node.js `>=24 <25`
- **UI:** `@saleor/macaw-ui-next` `1.4.2`, Lucide icons
- **Storybook:** `10.2.x` (`storybook dev -p 6006`, `build-storybook` → `storybook-static/`)
- **Testing:** Jest + Testing Library in `src/`; Playwright E2E in `playwright/`

## Conventions

- Feature modules under `src/<domain>/` with `views/`, `components/`, `urls.ts`, `queries.ts`, `mutations.ts`
- Path aliases: `@dashboard/*` → `src/*`, `@test/*` → `testUtils/*`
- **Named exports**; avoid new barrel `index.ts` files; direct imports preferred
- **CSS Modules** (`.module.css`) for component-scoped styles; Macaw `Box` props for layout
- **i18n:** all user-facing strings via `react-intl` (`defineMessages`, `FormattedMessage`); reuse `src/intl.ts` where possible
- **Icons:** `lucide-react` (not deprecated Macaw icons)
- Pre-merge: `pnpm run lint`, `check-types`, `test:quiet`, `knip`

## Existing patterns

- **Clipboard:** `useClipboard` hook (`src/hooks/useClipboard.ts`) — sets `copied` for 2s, icon swap feedback, console warn on failure
- **Copy icon in orders:** `ClipboardCopyIcon` (`CopyIcon` / `CheckIcon` toggle) in `src/orders/components/OrderCardTitle/`
- **TopNav actions:** `variant="secondary"` icon `Button` with `marginRight={3}` before `TopNav.Menu` (see `OrderDetailsPage`)
- **Order routes:** `orderPath`, `orderUrl` in `src/orders/urls.ts`; absolute URLs via `urlJoin(window.location.origin, getAppMountUriForRedirect(), path)`
- **Storybook:** stories at `src/**/*.stories.tsx`; decorators in `.storybook/preview.tsx` (Apollo, Intl, MemoryRouter, Macaw theme)

## Prior architectural decisions

- Frontend-only SPA; GraphQL codegen is source of truth (`pnpm run generate`); never hand-edit `*.generated.ts`
- Gradual TypeScript strictness via `typescript-strict-plugin`; new code should be strict-ready
- Filters migrating to `where` API; URL-synced state
- Unified extensions model (legacy per-type list UIs removed)

## Out of scope

- Backend / Saleor API changes for this dashboard ticket
- New clipboard primitives when `useClipboard` and `ClipboardCopyIcon` exist
- Toast on copy in orders domain (orders copy UIs use icon swap; gift cards use toast — DEV-66 follows orders pattern)
- Draft order TopNav (ticket targets non-draft `OrderDetailsPage` only; draft uses `OrderDraftPage`)
