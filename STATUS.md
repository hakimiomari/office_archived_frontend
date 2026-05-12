# Architecture Upgrade Status — Frontend

> **Frontend half** of the status doc. The backend rows + backend-specific
> deferred items and CI guards live in
> [`../office_archived_backend/STATUS.md`](../office_archived_backend/STATUS.md).
> Tracks what's shipped, what's deferred, and where to look in the codebase.
> See [`ARCHITECTURE_UPGRADE.md`](ARCHITECTURE_UPGRADE.md) for design intent
> and [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) for the frontend structure.

---

## Roadmap status (frontend)

| Item | Spec | Status | Where it lives |
|---|---|---|---|
| **1.2 (FE side)** | SUPER_ADMIN tenant switch via `X-Tenant-Company-Id` header | ✅ | `lib/api/axios.ts` request interceptor reads `superAdminCompanyId` from `localStorage` (via `TenantFilterContext`) and sends the header. |
| **4.1** | API layer structure | ✅ (scaffolded) | `api/{client,services,hooks}/`. Companies migrated as the canonical pattern (`api/services/companies.service.ts` + `api/hooks/use-companies.ts`). Per-feature migration is mechanical; see `api/README.md`. |
| **4.2** | Optimistic UI | ⚠️ deferred | See [Deferred items](#deferred-items) below. |
| **4.3** | Table performance | ✅ (partial) | `hooks/use-debounce.ts` — `useDebounce<T>(value, 300)`. Applied to the users page as the canonical pattern. Column-visibility persistence + list virtualization not yet done. |
| **4.4** | Role-based sidebar perf | ✅ (partial) | `permissions` is now `Set<string>` in `contexts/UserContext.tsx`; O(1) `.has()` lookup via `hooks/use-permission.ts`. Lazy-loading menu-group bundles (`dynamic()` per route group) not yet done. |
| **— (FE side)** | 401 → refresh → force-logout on expired refresh token | ✅ | `lib/api/axios.ts` — `forceLogout()`: clears the `access_token` cookie + `superAdminCompanyId/Name` localStorage, best-effort `POST /auth/logout`, hard-redirect to `/`. Network errors don't trigger it. |
| **— (FE side)** | CompanySwitcher consistency | ✅ | Fixed the "company shown twice" race (wait for `loaded` + dedupe in the setter); `useCompanies` emits `companies:changed` after every mutation and `CompanySwitcher` re-fetches; user-create form locks the company picker when a SUPER_ADMIN is scoped into a tenant. |

Backend items (§1.1, §1.3, §1.4, §2.x, §3.x, §5.x) and their status are in `../office_archived_backend/STATUS.md`.

---

## Deferred items (frontend)

### §4.2 — Optimistic UI

**Why deferred.** Doing optimistic-then-rollback manually in every page becomes a lot of throwaway code once React Query lands and owns mutation state. The patches end up looking like ad-hoc `useState` revert logic that you'll delete.

**Revisit when.** React Query (or SWR) is added to the frontend. The new `api/hooks/` directory is designed for exactly this — the per-feature hook layer becomes thin wrappers around `useQuery` / `useMutation` with `onMutate` doing optimistic updates and `onError` doing the rollback. Stock movements, sale creation, and payments are the three flows the architecture doc calls out as worth optimizing.

### React Query / SWR adoption (the bigger §3-Phase-3 frontend item)

**Why not yet.** The legacy `config/<feature>` hooks and the new `api/hooks/` hooks both work; switching to React Query is a per-feature migration that's only worth doing once the new `api/` structure has spread further. The seam is in place — `api/hooks/use-<feature>.ts` is exactly where `useQuery` / `useMutation` will live, with `api/services/<feature>.service.ts` underneath providing the pure request functions React Query wants to own.

**Revisit when.** You're adding a feature with non-trivial caching / revalidation needs (e.g. a dashboard that polls), or when the manual `fetch()`-then-`setState` pattern in the existing pages starts causing stale-data bugs. Start by wrapping the already-migrated `companies` feature, then propagate.

### Sidebar bundle lazy-loading (§4.4 remainder)

**Why not yet.** Not a correctness issue — the permission-gated nav already hides entries a user can't reach; this is purely about not shipping the Inventory page bundles to a `viewer`.

**Revisit when.** Bundle size becomes a measured problem (Lighthouse / web-vitals regression on the dashboard route). The fix is `next/dynamic` imports per route group with a small skeleton fallback.

---

## Quick reference for a new frontend contributor

1. **Start with** [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) for the structure and conventions. For anything touching the API, also read `../office_archived_backend/SYSTEM_OVERVIEW.md` §5 for the route catalogue.
2. **Then read** [`ARCHITECTURE_UPGRADE.md`](ARCHITECTURE_UPGRADE.md) for the design intent.
3. **Then this file** for the current state.
4. **New feature?** Use the `api/{client,services,hooks}/` structure (see `api/README.md`): a pure `services/<feature>.service.ts` (no React, no toast, throws) and a `hooks/use-<feature>.ts` wrapper (toast handling). New pages are client components with `<RouteGuard permission="x.read">`, server-side pagination, and `useDebounce` on search inputs.
5. **Migrating an existing feature?** Move types + request fns from `config/<feature>/<feature>.ts` into `api/services/<feature>.service.ts` (strip toasts, throw on error); add `api/hooks/use-<feature>.ts` returning the same shape; update the pages' import paths; delete the legacy file.
6. **Permission gating?** `<RouteGuard permission="x.read">` for the page body, `<PermissionGate permission="x.create">` for individual buttons. `usePermission().can(...)` is O(1).
7. **Cross-component refresh after a mutation?** Dispatch `window.dispatchEvent(new CustomEvent('<feature>:changed'))` from the hook and have the other component listen — see `useCompanies` / `CompanySwitcher` for the pattern.
8. **i18n** — every user-visible string goes through `useTranslations("namespace")(key)`; add it to `messages/{en,fa,ps}.json`.

---

End of document.
