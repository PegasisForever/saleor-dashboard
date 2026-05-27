# Project Context

## Tech stack

- **Application:** Saleor Dashboard v3.23.5 — React 18.3 + TypeScript 5.8 SPA
- **Runtime:** Node.js >=24, pnpm 10.28.2
- **Build:** Vite 7.3 with SWC; dev server on port 9000
- **Data:** Apollo Client 3.4.17 against Saleor GraphQL schema 3.23
- **UI:** `@saleor/macaw-ui-next` 1.4.2, Lucide icons, CSS Modules with `--mu-*` tokens
- **Routing:** React Router v5; basename from `getAppMountUri()`
- **i18n:** react-intl with hash-based message IDs (`defineMessages`)
- **Component docs:** Storybook 10.2.16 (`pnpm run storybook` / `pnpm run build-storybook`)
- **Testing:** Jest + Testing Library; Playwright for E2E

## Conventions

- Feature modules under `src/<domain>/` with `views/`, `components/`, `urls.ts`, `queries.ts`, `mutations.ts`
- Named exports only (no default exports except Storybook meta)
- Path aliases: `@dashboard/*` → `src/*`, `@test/*` → `testUtils/*`, `@storybookUtils/*` → `storybookUtils/*`
- New components: co-located `ComponentName.module.css`, `ComponentName.stories.tsx`, optional `messages.ts`
- User-facing strings via `defineMessages` / `FormattedMessage`; reuse `buttonMessages` and `commonMessages` from `src/intl.ts` where applicable
- Icons from `lucide-react`; deprecated Macaw/MUI icons forbidden
- ESLint enforces import sort, no console.log, formatjs message IDs

## Existing patterns

- **Clipboard:** `useClipboard()` hook (`src/hooks/useClipboard.ts`) returns `[copied, copy]` with 2s auto-reset; failures log `console.warn` only
- **Copy icon:** `ClipboardCopyIcon` (`src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`) toggles Copy/Check Lucide icons
- **Copyable inline text:** `CopyableText` component for hover-reveal copy beside text
- **Absolute dashboard URLs:** `urlJoin(window.location.origin, getAppMountUriForRedirect(), path)` (see `src/staff/views/StaffList/StaffList.tsx`, `src/auth/utils.ts`)
- **Order routes:** `orderPath(id)` → `/orders/{id}`; `orderUrl(id)` adds query string (avoid for share links)
- **TopNav actions:** Secondary icon `Button` children before `TopNav.Menu` (see `OrderDetailsPage.tsx` metadata button)
- **Toasts:** `useNotifier()` via Sonner; clipboard hook does not toast on failure by default
- **Storybook:** Global decorators provide Apollo, MemoryRouter, IntlProvider, Macaw theme in `.storybook/preview.tsx`

## Prior architectural decisions

- Gradual TypeScript strictness via `typescript-strict-plugin`; new code should be properly typed without `@ts-strict-ignore`
- Prefer `@saleor/macaw-ui-next` over legacy `@saleor/macaw-ui` and Material UI
- No barrel `index.ts` exports for new code — direct file imports
- GraphQL generated files (`*.generated.ts`) are never hand-edited
- Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`
- Long lists need scroll containers and explicit loading/empty states

## Out of scope

- Backend/API changes — Dashboard is frontend-only against existing Saleor GraphQL
- New clipboard utilities when `useClipboard` + `ClipboardCopyIcon` suffice
- Default exports, inline user-facing strings, hardcoded colors, story-only CSS for production interaction states
- SSR or non-browser clipboard fallbacks beyond existing hook behavior
