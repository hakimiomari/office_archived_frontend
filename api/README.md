# API layer (Phase 4 §4.1)

The new API layer is split into three concerns so each can evolve
independently. The legacy `config/<feature>/<feature>.ts` files still
work; new features should use this structure, and existing features
should migrate when next touched.

```
api/
├── client/      # The axios instance + interceptors. Re-exports from
│                #   lib/api/axios.ts so all callers share one client.
├── services/    # Pure async functions per resource. NO React, NO toast.
│                #   Throw on error so React Query / consumers can decide
│                #   how to surface failures.
└── hooks/       # React hooks that wrap services with toast handling and
                 #   (later) optimistic UI / React Query caching.
```

**Why this split?** The current `useFoo()` hooks return objects of
functions that each catch their own errors and pop their own toast. That
makes them awkward to use with React Query / SWR — those libraries want
to OWN error handling. Separating the pure service layer lets you swap
the hook layer for a React Query wrapper later without rewriting any
page code.

## Reference example

See `api/services/companies.service.ts` + `api/hooks/use-companies.ts`.
The companies feature is the canonical migration.

## Migration checklist (per feature)

1. Move pure types + request functions from `config/<feature>/<feature>.ts`
   to `api/services/<feature>.service.ts`. **Strip toast calls; throw on
   error.**
2. Create `api/hooks/use-<feature>.ts` that wraps the service with toast
   handling and returns the same shape as the old `useFoo()` hook for
   drop-in replacement.
3. Update the feature's pages to import from the new hook.
4. Delete `config/<feature>/<feature>.ts` once nothing imports it.

Migrating is mechanical and can happen incrementally per feature.
