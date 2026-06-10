# Zermatoon — Frontend System Overview

> **Frontend half** of the system overview. The backend structure, full data
> model, and the HTTP route catalogue (the API contract this frontend
> consumes) live in
> [`../office_archived_backend/SYSTEM_OVERVIEW.md`](../office_archived_backend/SYSTEM_OVERVIEW.md).
> Cross-cutting sections (tech stack, multi-tenancy model, auth lifecycle,
> running instructions, credentials) are duplicated into both halves so each
> is self-contained. For the *current* state of architectural upgrades, see
> [`STATUS.md`](STATUS.md) in this directory.
>
> Hand this file to any AI agent (ChatGPT, Claude, etc.) so it can extend the
> frontend without breaking existing conventions.

---

## 1. Tech stack

### Frontend (`office_archived_frontend/`)
- **Framework**: Next.js 15 (App Router, RSC where possible, client components elsewhere)
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS
- **Searchable dropdowns**: every `<Select>` across the app is a `<Combobox>` ([`components/ui/combobox.tsx`](components/ui/combobox.tsx)) — Popover + cmdk under the hood, with a built-in search input, "no results" state, and selected-check marker. The underlying shadcn `<Select>` primitive is still present at [`components/ui/select.tsx`](components/ui/select.tsx) but no consumer imports it; prefer Combobox for new code.
- **i18n**: `next-intl` (en, fa, ps — Pashto/Dari are RTL)
- **Charts**: Recharts
- **Tables**: `@tanstack/react-table`
- **Forms / state**: native React state + small custom hooks (no Formik / RHF)
- **HTTP**: Axios with global request interceptor for auth + tenant scoping

### Backend (`office_archived_backend/`)
- **Runtime**: Node.js + TypeScript / NestJS / Prisma (PostgreSQL)
- **Auth**: JWT (access + refresh) in cookies, plus Google OAuth
- **Other**: Redis (refresh-token blacklist), MinIO (object storage), pdfkit, `@nestjs/schedule` (cron), `@nestjs/event-emitter`, Swagger
- See the backend half of this doc for the full picture.

---

## 2. High-level architecture (multi-tenancy, as it affects the frontend)

- The backend is a multi-tenant SaaS — every business row carries a `companyId`. The frontend never sets `companyId`; the server injects it.
- Three user-tenancy roles, surfaced on `UserContext.user.userRole`:
  - `SUPER_ADMIN` — `companyId = null`. Sees everything across tenants; can pick a company to scope into via the sidebar `CompanySwitcher`.
  - `COMPANY_ADMIN` — full powers within their own company.
  - `COMPANY_USER` — restricted by `Role`-based permissions, scoped to their own company.
- **How the frontend signals tenant scope**: when a SUPER_ADMIN picks a company in the sidebar switcher, `TenantFilterContext` persists the choice to `localStorage` (`superAdminCompanyId` / `superAdminCompanyName`), and the axios request interceptor sends it as the `X-Tenant-Company-Id` header on every request. The backend ignores this header for non-SUPER_ADMIN users — it's a hint, not a permission.
- **Soft delete**: deleting a record on the backend is a soft-delete. Only a SUPER_ADMIN can see soft-deleted rows, by sending `X-Show-Deleted: 1` — there is no UI for this yet; wiring it would be a checkbox that toggles the header on outgoing requests.
- **Permission gating** has two layers:
  - **Route**: `<RouteGuard permission="x.read">` wraps the page body.
  - **UI element**: `<PermissionGate permission="x.create">` hides individual buttons/menus.
  - `usePermission()` exposes `can / canAny / canAll`, backed by a `Set<string>` on `UserContext` for O(1) lookups.

---

## 3. Frontend structure

```
app/
├── (auth)/                    # Public — login + Google login
│   └── page.tsx
├── (dashboard)/               # Authenticated layout (sidebar + header)
│   ├── layout.tsx             # Wraps with TenantFilterProvider, LicenseProvider, SidebarProvider
│   ├── dashboard/page.tsx     # KPI dashboard
│   ├── companies/page.tsx     # SUPER_ADMIN-only company CRUD
│   ├── inventory/             # Items, warehouses, suppliers, etc.
│   │   ├── alerts/, categories/, items/, movements/, page.tsx,
│   │   ├── purchases/, reports/, stock-counts/, suppliers/,
│   │   └── warehouses/  +  warehouses/[id]/page.tsx
│   ├── sales/                 # Sales, customers, payments, overdue, reports
│   ├── employees/             # Employees + departments
│   ├── users/                 # User CRUD + create + edit
│   ├── roles/                 # Role CRUD
│   └── profile/page.tsx
├── layout.tsx                 # RootLayout: ThemeProvider, LocaleProvider, UserProvider, Toaster
└── page.tsx                   # Redirects unauthenticated → (auth)

components/
├── shared/app-sidebar.tsx     # All sidebar navigation; Companies entry SUPER_ADMIN-only (hidden when scoped into a tenant)
├── company-switcher.tsx       # SUPER_ADMIN-only picker — writes to TenantFilterContext + localStorage; listens for `companies:changed` to re-fetch
├── user-form.tsx              # Reusable user create/edit form (used in /users page dialog AND /users/create page); locks the company picker when a SUPER_ADMIN is scoped into a tenant
├── permission-gate.tsx        # <PermissionGate permission="x.read">…</PermissionGate>
├── route-guard.tsx            # Page-level guard
├── confirm-dialog.tsx
├── data-table*                # Tanstack Table helpers
├── ui/                        # shadcn primitives (button, input, dialog, …)
│   ├── combobox.tsx           # ★ Searchable dropdown used in place of <Select> everywhere
│   └── select.tsx             # Underlying shadcn Select (no consumers; kept for future need)
└── reports/, tenders/         # Chart components

api/                           # New API layer (Phase 4 §4.1 — companies migrated; others still in config/)
├── README.md                  # the three-tier structure + per-feature migration checklist
├── client/index.ts            # re-exports the shared axios instance from lib/api/axios.ts
├── services/<feature>.service.ts  # pure async request fns — NO React, NO toast, throw on error
└── hooks/use-<feature>.ts     # React hooks wrapping services with toast handling (future: React Query lives here)
                               # e.g. api/services/companies.service.ts + api/hooks/use-companies.ts
                               #   use-companies emits a `companies:changed` window event after every mutation

config/                        # Legacy API hooks (mirror backend structure; migrating to api/ feature by feature)
├── auth.ts                    # useAuth() — login, logout, googleAuth
├── alerts/alerts.ts
├── categories/categories.ts
├── employees/employees.ts
├── inventory/inventory.ts     # Catch-all for items, warehouses, suppliers, purchases, reports, etc.
├── sales/sales.ts             # Catch-all for sales, customers, payments
├── settings.ts                # Misc helpers (getNameInitials)
└── users/users.ts, users/roles.ts

contexts/
├── UserContext.tsx            # useUser() — current user + permissions (Set<string>) + roles + fetchProfile
├── LocaleContext.tsx          # useLocale() — { locale, setLocale, dir }
├── TenantFilterContext.tsx    # SUPER_ADMIN's selected company (localStorage-backed: superAdminCompanyId / superAdminCompanyName)
└── LicenseContext.tsx, ArchiveContext.tsx

hooks/
├── use-permission.ts          # can / canAny / canAll — O(1) over the permissions Set
└── use-debounce.ts            # useDebounce<T>(value, delayMs=300) — for search inputs

lib/
├── api/axios.ts               # Auth header + X-Tenant-Company-Id injection; 401 → refresh; refresh-fail → forceLogout (clear cookies + localStorage + redirect to /)
└── route.ts                   # nextRoute() — useRouter wrapper

messages/{en,fa,ps}.json       # i18n strings for next-intl
```

### Frontend conventions
- Pages are client components (`"use client"`) because they call hooks like `useUser()` / `useEffect`.
- Forms hold local `useState`; submission handled inline (no Formik / RHF).
- API calls go through `config/<feature>/<feature>.ts` (legacy) or `api/hooks/use-<feature>.ts` (new) — never direct `axios.get` from a page. That layer owns the toast-on-error pattern.
- **New features** should use the `api/{client,services,hooks}/` structure (see `api/README.md`); existing features migrate when next touched.
- Permission gating: `<RouteGuard>` for the page, `<PermissionGate>` for individual elements. Sidebar entries are auto-filtered by `requiredPermissions` per nav item plus `userRole === 'SUPER_ADMIN'` for the Companies entry (also hidden when a SUPER_ADMIN is scoped into a tenant).
- Localization: every user-visible string goes through `useTranslations("namespace")(key)`. Don't hardcode UI text.
- Search inputs should use `useDebounce` (300 ms default) so a keystroke doesn't fire N requests.
- Cross-component refresh: a mutation can dispatch a `window.dispatchEvent(new CustomEvent('<feature>:changed'))` and other components listen — `useCompanies` does this with `companies:changed`, which `CompanySwitcher` consumes.
- **Dropdowns**: use `<Combobox>` ([`components/ui/combobox.tsx`](components/ui/combobox.tsx)) for every picker — even a 3-option enum — so the UX is uniform with the rest of the app. The component is fully controlled (`value` + `onValueChange`) and takes a flat `options: { value, label }[]` array. There is no group/separator support; flatten with a label prefix if you need visual grouping (see `ThemeSelector` for an example).

#### Combobox API (the only dropdown primitive in active use)

```tsx
import { Combobox } from "@/components/ui/combobox";

<Combobox
  value={form.warehouseId}
  onValueChange={(v) => setForm({ ...form, warehouseId: v })}
  options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
  placeholder={t("selectWarehouse")}              // empty-value display
  searchPlaceholder="Search warehouses..."         // text inside the search input
  emptyMessage="No warehouse found."               // shown when search filters everything out
  triggerClassName="h-9 w-[200px]"                 // ports any className that used to be on <SelectTrigger>
  disabled={form.userRole === "SUPER_ADMIN"}       // optional
/>
```

Migration cheat sheet from the legacy `<Select>`:
- `<Select value=... onValueChange=...>...</Select>` → `<Combobox value=... onValueChange=...>`.
- `<SelectItem>` children → an entry in the `options` array.
- Static-list Selects (enums) → inline a literal `options={[{ value: "...", label: "..." }]}`.
- Mixed Selects (one literal `"ALL"` item + a `.map()`) → combine into a single options array: `options={[{ value: "ALL", label: "All" }, ...items.map(...)]}`.
- `<SelectTrigger className="...">` → `triggerClassName="..."` on the Combobox.
- Rich `<SelectItem>` children (icons, badges) → flatten to plain text. The `<Badge>inactive</Badge>` pattern in `company-switcher.tsx` became `" (inactive)"` as a suffix.

---

## 4. Auth & request lifecycle (frontend view)

1. `POST /auth/sign-in` (via `useAuth().login`) → backend sets `access_token` (httpOnly: false, 15 min) + `refresh_token` (httpOnly: true, 15 days) cookies.
2. The axios **request interceptor** reads the `access_token` cookie and sets `Authorization: Bearer …`, plus `X-Tenant-Company-Id: N` when `TenantFilterContext` has a company selected.
3. On a `401`, the axios **response interceptor** calls `GET /auth/refresh-token` once. On success it retries the original request; concurrent 401s queue and replay.
4. If the refresh **fails with a server response** (expired / blacklisted / missing refresh token), `forceLogout()` runs: clear the `access_token` cookie, clear the `superAdminCompanyId` / `superAdminCompanyName` localStorage keys, fire a best-effort `POST /auth/logout`, and hard-navigate to `/`. A pure network error doesn't trigger logout.
5. `UserContext.fetchProfile()` (`GET /user/profile`) populates `user`, `roles[]`, and the `permissions` Set on app boot (skipped on `/`).

The full server-side lifecycle (AuthGuard → TenantInterceptor → PermissionGuard → Service → Prisma extension) is in the backend half of this doc.

---

## 5. Key files for a frontend integrator to read

| Concern                                  | File                                            |
|------------------------------------------|-------------------------------------------------|
| Axios instance, auth/tenant headers, 401 refresh, force-logout | `lib/api/axios.ts`               |
| New API layer pattern                    | `api/README.md`, `api/services/companies.service.ts`, `api/hooks/use-companies.ts` |
| User / permissions context               | `contexts/UserContext.tsx`                       |
| Permission hook                          | `hooks/use-permission.ts`                        |
| SUPER_ADMIN tenant scope (picker + persistence) | `contexts/TenantFilterContext.tsx`, `components/company-switcher.tsx` |
| Sidebar (permission-gated nav)           | `components/shared/app-sidebar.tsx`              |
| Reusable user form (tenancy controls)    | `components/user-form.tsx`                        |
| Searchable dropdown primitive            | `components/ui/combobox.tsx`                      |
| Debounced search                         | `hooks/use-debounce.ts`                          |
| i18n strings                             | `messages/{en,fa,ps}.json`                       |
| Backend half of this doc + API contract  | `../office_archived_backend/SYSTEM_OVERVIEW.md`  |

---

## 6. Extension example — frontend half of "Invoice tracking"

(The backend half — Prisma model, NestJS module, routes, cron — is in
`../office_archived_backend/SYSTEM_OVERVIEW.md` §9.)

1. **New API layer files** following the `api/` pattern:
   - `api/services/invoice-tracking.service.ts` — pure request functions for the new `/invoice-tracking/*` routes, types alongside, throws on error.
   - `api/hooks/use-invoice-tracking.ts` — wraps the service with toast handling; returns a familiar `useInvoiceTracking()` shape.
2. **New page** `app/(dashboard)/invoice-tracking/page.tsx` — client component, uses `<RouteGuard permission="invoice.tracking.read">`, server-side pagination, `useDebounce` on the search input, and `<Combobox>` (not raw `<Select>`) for any picker — status filter, customer picker, page-size selector, etc.
3. **Sidebar entry** in `components/shared/app-sidebar.tsx` behind `requiredPermissions: ['invoice.tracking.read']`.
4. **i18n** — add the page's strings to `messages/{en,fa,ps}.json` and read them via `useTranslations`.
5. **Permission-gate** action buttons (`<PermissionGate permission="invoice.tracking.update">`).
6. If a mutation on this page should refresh another component, dispatch `window.dispatchEvent(new CustomEvent('invoice-tracking:changed'))` from the hook and have the other component listen — same pattern as `companies:changed`.

For "Payment tracking" (bank reconciliation), the backend already has a
`BankAccount` / `BankTransaction` / `Reconciliation` module; the missing
piece is a frontend matcher UI (a `/banking/*` page set following the same
conventions).

---

## 7. Default credentials (dev)

- Super admin: `hakimikamranullah@gmail.com` / `admin`
- Default company: `id=1, name="Default Company", slug="default"`

Re-run `npx prisma db seed` (backend) to re-promote the admin to SUPER_ADMIN and re-create roles/permissions.

---

## 8. Running the system

Frontend:
```bash
cd office_archived_frontend
npm install
npm run dev                 # http://localhost:3001
```

Backend (required for the frontend to work):
```bash
cd office_archived_backend
npm install
npx prisma migrate deploy   # or migrate dev to also generate the client
npx prisma db seed
npm run start:dev           # API on http://localhost:8001
```

The frontend's axios `baseURL` is `http://localhost:8001/api/`.

---

End of document.
