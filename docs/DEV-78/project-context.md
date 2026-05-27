# Project Context

## Tech stack

- TypeScript 5.8.3, React 18.3.1, Node >=24, pnpm 10.28.2
- Vite 7.3.2 (dev port 9000), Apollo Client 3.4.17, React Router v5
- UI: `@saleor/macaw-ui-next`, Lucide icons, CSS Modules for complex styling
- i18n: react-intl with `defineMessages` / `FormattedMessage`
- Storybook 10.2.16 (`pnpm run storybook` port 6006, `pnpm run build-storybook`)
- Tests: Jest + Testing Library (unit), Vitest + Storybook addon (component stories)

## Conventions

- Named exports; no barrel `index.ts` files for new code
- Path aliases: `@dashboard/*` → `src/*`
- Co-locate `messages.ts`, `*.module.css`, `*.stories.tsx`, tests with components
- User-facing strings in i18n catalogs (`messages.ts` or `src/intl.ts`); run `pnpm run extract-messages` after changes
- Prefer `@saleor/macaw-ui-next` Box props for simple layout; CSS Modules for pseudo-states
- Import sort: external → `@dashboard/*` → relative

## Existing patterns

- **Clipboard:** `useClipboard()` hook (`src/hooks/useClipboard.ts`) returns `[copied, copy]`; resets after 2s
- **Copy icon:** `ClipboardCopyIcon` (`src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`) toggles Copy/Check Lucide icons
- **TopNav actions:** Secondary `Button` with icon + `TopNav.Menu` on detail pages (e.g. `OrderDetailsPage.tsx`)
- **Order URLs:** `orderPath(id)`, `orderUrl(id, params)` in `src/orders/urls.ts`; absolute URLs via `urlJoin(window.location.origin, getAppMountUriForRedirect(), path)`
- **Toasts:** `useNotifier()` for async feedback; synchronous copy uses inline icon swap (see `TrackingNumberDisplay`)
- **Storybook:** CSF3, global decorators in `.storybook/preview.tsx` (Apollo, Router, Intl, themes)

## Prior architectural decisions

- Frontend-only SPA; consumes Saleor GraphQL backend
- Dual GraphQL schema (main/staging) at build time; single API URL at runtime
- Generated `*.generated.ts` files must not be hand-edited
- New components require Storybook stories
- Dependency overrides in `pnpm-workspace.yaml`, not `package.json`

## Out of scope

- Backend/API changes
- New clipboard utilities or copy-icon components (reuse existing)
- Manual edits to auto-generated GraphQL artifacts
- Legacy `@saleor/macaw-ui`, Material UI for new UI
- Barrel exports and default exports for new modules
