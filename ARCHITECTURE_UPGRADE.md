# Architecture Improvement & Upgrade Blueprint — Frontend

> **Frontend half** of the upgrade blueprint. The backend improvements
> (§1 critical fixes, §2 architecture, §3 scalability, §5 ERP evolution)
> live in
> [`../office_archived_backend/ARCHITECTURE_UPGRADE.md`](../office_archived_backend/ARCHITECTURE_UPGRADE.md).
> Cross-cutting sections (final vision, priority roadmap, AI-integration
> notes) are duplicated into both halves. For what's actually shipped vs.
> deferred, see [`STATUS.md`](STATUS.md) in this directory. For the frontend
> structure and conventions, see [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md).

---

## 4. 🟢 Frontend Improvements

### 4.1 Improve API Layer Structure

**Current.** `config/<feature>/<feature>.ts` mixes the API client with
business logic and toast handling. As the system grows, refactor to a
three-tier structure:

```
api/
├── client/        # raw axios instance + interceptors (re-exported from lib/api/axios.ts)
├── services/      # request functions per resource — NO React, NO toast, throw on error
└── hooks/         # React hooks wrapping services (toast handling; later: React Query / SWR)
```

**Why this split?** The current `useFoo()` hooks return objects of functions
that each catch their own errors and pop their own toast — awkward to use
with React Query / SWR, which want to *own* error handling. Separating the
pure service layer lets you swap the hook layer for a React Query wrapper
later without rewriting any page code.

**Status.** Scaffolded (`api/README.md` documents the structure and the
per-feature migration checklist); the **companies** feature is migrated as
the canonical example (`api/services/companies.service.ts` +
`api/hooks/use-companies.ts`). Remaining features migrate when next touched.

---

### 4.2 Add Optimistic UI Updates

For high-frequency actions where success is highly likely:
- Stock movements
- Sales creation
- Payments

The pattern:
1. Apply the change to local state immediately.
2. Issue the API call.
3. On error, roll back local state and show a toast.

**Benefit.** Faster perceived UX, less spinner-staring, closer to a desktop
ERP feel.

**Status.** Deferred — doing optimistic-then-rollback manually in every page
becomes throwaway code once React Query lands and owns mutation state. The
new `api/hooks/` directory is the natural home: the hook layer becomes thin
`useMutation` wrappers with `onMutate` doing the optimistic update and
`onError` the rollback. Revisit alongside React Query. See [`STATUS.md`](STATUS.md).

---

### 4.3 Improve Table Performance Strategy

For tables that may grow past a few thousand rows:
- Server-side pagination (already in place for most endpoints — extend to all).
- Debounce search inputs (300–500 ms) — use `hooks/use-debounce.ts` (`useDebounce<T>(value, 300)`); applied to the users page as the canonical pattern.
- Persist column visibility per user in `localStorage`.
- Virtualize very long scrollable lists with `@tanstack/react-virtual`.

---

### 4.4 Role-based Sidebar Optimization

The sidebar already permission-gates entries. Enhancements:
- **Pre-compute the user's permission set as a `Set<string>`** on `UserContext` so `usePermission().can(...)` is O(1) (not array `.includes()`). ✅ shipped.
- Lazy-load menu groups (e.g., Inventory) so a viewer never downloads the
  Inventory page bundles. (Not yet done — straightforward `dynamic()` import per route group.)

---

## 6. 🧩 Final Architecture Vision

If the upgrades above (plus the backend ones) are applied, the system becomes:

- ✅ Multi-tenant SaaS ERP with airtight data isolation.
- ✅ Financial-grade accounting with double-entry ledger + reconciliation.
- ✅ Event-driven, scalable backend ready to extract microservices.
- ✅ Audit-compliant — every change is logged with before/after JSON.
- ✅ Enterprise-ready NestJS monolith + a Next.js frontend with a clean,
  React-Query-ready API layer.

---

## 7. 📌 Priority Roadmap

| Phase | Items | Where |
|---|---|---|
| **Phase 1 — Safety** | Cron isolation; SUPER_ADMIN tenant switch → `X-Tenant-Company-Id` header (frontend axios sends it); raw-SQL wrapper + CI check; request-scoped logger | Mostly backend; frontend axios change |
| **Phase 2 — Structure** | Split `sales/` + `inventory/`; (DomainService — deferred); `tenantCreate<T>` helpers; `deletedAt` soft-delete | Backend |
| **Phase 3 — Scalability** | `AuditLog` + auto-write hook; event bus + listeners; composite indexes; cron hard rules; **React Query in frontend `api/hooks/`** | Backend + frontend |
| **Phase 4 — Frontend** | **§4.1 API layer restructure** (scaffolded + companies migrated); §4.2 optimistic UI (deferred); §4.3 table perf (`useDebounce` shipped); §4.4 sidebar perf (Set-based permissions shipped) | Frontend |
| **Phase 5 — ERP Evolution** | Accounting module; posting rules via the event bus; bank-reconciliation module; (period-close locking — partial; full financial reporting engine — follow-up) | Backend (frontend matcher UI for banking is a follow-up) |

See [`STATUS.md`](STATUS.md) for the per-item shipped/deferred state.

---

## 8. Implementation reference for an integrating AI

When asking ChatGPT (or another agent) to apply any of the above:

1. Always pass [`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) (frontend) **first** so the agent knows the existing conventions; for anything touching the API, also pass `../office_archived_backend/SYSTEM_OVERVIEW.md` for the route catalogue.
2. Then point at the specific section here, e.g.: *"Implement §4.1 for the `sales` feature: create `api/services/sales.service.ts` (pure, throws) + `api/hooks/use-sales.ts` (toast wrapper), migrate the pages, delete `config/sales/sales.ts`. Follow `api/README.md`."*
3. After each task, run `npx tsc --noEmit -p tsconfig.json` (frontend) to confirm types compile. (`next build` currently fails on a pre-existing static-prerender bug on the `(auth)/page.tsx` root route — unrelated to app code; `tsc` + dev mode are the working signals.)

---

End of document.
