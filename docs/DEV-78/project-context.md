# Project Context

## Tech stack

- **Runtime:** Node.js >= 24, pnpm 10.28.2
- **App:** Saleor Dashboard 3.23.5 — React 18.3.1, TypeScript 5.8.3, Vite 7.3.2
- **Data:** Apollo Client 3.4.17, GraphQL 16.11.0 (codegen via `pnpm run generate`)
- **UI:** `@saleor/macaw-ui-next` 1.4.2, Lucide icons, CSS Modules
- **Forms / routing / i18n:** React Hook Form, React Router v5, react-intl 5.25.1
- **Testing:** Jest 27 + Testing Library (unit), Playwright 1.58 (E2E), Vitest 4 (Storybook)
- **Storybook:** 10.2.16 (`pnpm run storybook`, `pnpm run build-storybook`)

## Conventions

- Feature modules under `src/{domain}/` with `views/`, `components/`, `urls.ts`, `queries.ts`, `mutations.ts`
- Path aliases: `@dashboard/*` → `src/*`, `@test/*` → `testUtils/*`
- Named exports only (no default exports in new code); no barrel `index.tsx` files
- Colocated files: `ComponentName.tsx`, `ComponentName.module.css`, `ComponentName.stories.tsx`, `messages.ts`
- ESLint enforces import sort, formatjs message IDs, macaw-ui-next over legacy macaw-ui
- Strict TypeScript for new code; repo-wide `strict: false` with gradual migration

## Existing patterns

- **Auth:** `useUser()` + `SectionRoute` permission gating
- **GraphQL:** Generated hooks from `@dashboard/graphql`; `makeQuery`/`makeMutation` wrappers with auto error handling
- **Toasts:** `useNotifier()` → Sonner via `NotificationProvider`
- **Clipboard:** `useClipboard()` hook (2s copied state); `ClipboardCopyIcon` in orders; `CopyableText` for inline copy
- **i18n:** `defineMessages` in colocated `messages.ts` or `FormattedMessage`; reuse `src/intl.ts` common messages
- **TopNav actions:** Secondary icon `Button` from macaw-ui-next in `TopNav` children slot
- **Shareable URLs:** `urlJoin(window.location.origin, getAppMountUriForRedirect(), path)` pattern (see staff invite redirect)

## Prior architectural decisions

- Static SPA deployed as static files; client-side routing with `basename: getAppMountUri()`
- GraphQL types/hooks are generated — never hand-edit `*.generated.ts`
- New UI must use macaw-ui-next + Lucide, not legacy `@saleor/macaw-ui` or MUI icons
- Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`
- List UIs must handle 50+ items (scroll containers, skeletons, empty states)

## Out of scope

- Backend / Saleor Core changes
- SSR or server-rendered pages
- New clipboard utilities (reuse `useClipboard` + `ClipboardCopyIcon`)
- Default exports, barrel index files, legacy macaw-ui in new code
- Inline user-facing strings without react-intl
