/**
 * Shared axios client. The instance, interceptors (auth header, tenant
 * scoping, refresh-token retry) live in `lib/api/axios.ts` and are
 * re-exported here so callers in the new `api/` tree don't reach across
 * directories.
 *
 * Importing from `@/lib/api/axios` directly also still works — both
 * paths resolve to the same singleton.
 */
export { default as api } from "@/lib/api/axios";
