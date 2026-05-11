"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useTenantFilter } from "@/contexts/TenantFilterContext";
import {
  useCompanies,
  Company,
  COMPANIES_CHANGED_EVENT,
} from "@/api/hooks/use-companies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconBuilding, IconUserShield } from "@tabler/icons-react";

/**
 * Lets a SUPER_ADMIN pick a company to scope their entire UI to. Setting
 * "All companies" clears the filter (sees everything aggregated). Renders
 * nothing for non-SUPER_ADMIN users — their tenant is already locked by JWT.
 *
 * Visual states:
 *  - No company selected → an unobtrusive grey "Super admin · all companies"
 *    banner with the picker.
 *  - A specific company selected → a coloured banner showing the company
 *    name + an "acting as" indicator, so the SUPER_ADMIN never forgets they
 *    are temporarily inside a tenant's view.
 */
export function CompanySwitcher() {
  const { user } = useUser();
  const { filterCompanyId, filterCompanyName, setFilterCompany } =
    useTenantFilter();
  const { list, get } = useCompanies();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load the dropdown list on mount AND whenever a mutation elsewhere
  // fires `companies:changed` (see `useCompanies` in api/hooks/). That's
  // how the picker stays in sync when a SUPER_ADMIN adds/edits/deletes
  // a company on `/dashboard/companies` without a full page reload.
  useEffect(() => {
    if (user?.userRole !== "SUPER_ADMIN") return;
    let cancelled = false;
    const refresh = () => {
      list({ limit: 200 }).then((r) => {
        if (cancelled) return;
        setCompanies(r.data);
        setLoaded(true);
      });
    };
    refresh();
    window.addEventListener(COMPANIES_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(COMPANIES_CHANGED_EVENT, refresh);
    };
  }, [user?.userRole]);

  // Belt-and-braces: if the selected company isn't in the list (pagination,
  // failed fetch, slow response, etc.), fetch it directly by id so the
  // trigger always shows the real name rather than `Company #N`.
  //
  // Two guards prevent the "company shown twice in the dropdown" race:
  //   1. Wait for `loaded` so we never fire the fallback while the list
  //      is still in flight. If the list arrives and contains the
  //      company, this effect's body short-circuits at the .some() check.
  //   2. Dedupe inside the setter so an out-of-order `get()` resolution
  //      (e.g. list arrived first, get arrived second) cannot double-add.
  useEffect(() => {
    if (user?.userRole !== "SUPER_ADMIN") return;
    if (filterCompanyId == null) return;
    if (!loaded) return;
    if (companies.some((c) => c.id === filterCompanyId)) return;
    get(filterCompanyId).then((c) => {
      if (!c) return;
      setCompanies((prev) =>
        prev.some((p) => p.id === c.id) ? prev : [...prev, c],
      );
    });
  }, [filterCompanyId, user?.userRole, companies, loaded]);

  if (!user || user.userRole !== "SUPER_ADMIN") return null;

  const value = filterCompanyId == null ? "ALL" : String(filterCompanyId);
  const current = companies.find((c) => c.id === filterCompanyId);
  const scoped = filterCompanyId != null;

  return (
    <div
      className={
        "rounded-md border px-2 py-2 transition-colors " +
        (scoped
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border bg-muted/40")
      }
    >
      {/* Active-scope label */}
      <div className="mb-1.5 flex items-center gap-1.5">
        {scoped ? (
          <>
            <IconBuilding className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            <span className="truncate text-xs font-semibold text-amber-700 dark:text-amber-400">
              {current?.name ??
                filterCompanyName ??
                `Company #${filterCompanyId}`}
            </span>
            <Badge
              variant="outline"
              className="ms-auto border-amber-500/40 text-[9px] uppercase tracking-wide text-amber-700 dark:text-amber-400"
            >
              acting as
            </Badge>
          </>
        ) : (
          <>
            <IconUserShield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate text-xs font-medium text-muted-foreground">
              Super admin
            </span>
            <Badge
              variant="outline"
              className="ms-auto text-[9px] uppercase tracking-wide"
            >
              all companies
            </Badge>
          </>
        )}
      </div>

      <Select
        value={value}
        onValueChange={(v) => {
          if (v === "ALL") {
            setFilterCompany(null);
          } else {
            const id = Number(v);
            const picked = companies.find((c) => c.id === id);
            setFilterCompany(id, picked?.name ?? null);
          }
          // Force the rest of the page to re-fetch with the new filter.
          if (typeof window !== "undefined") window.location.reload();
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          {/*
            Pin the displayed text explicitly. Resolution order:
              1. Live-loaded company name (best — current data).
              2. Cached name from localStorage (instant on cold reload).
              3. `Company #N` placeholder (only briefly, while we fetch).
          */}
          <SelectValue placeholder="All companies">
            {scoped
              ? current?.name ??
                filterCompanyName ??
                `Company #${filterCompanyId}`
              : "All companies"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All companies</SelectItem>
          {loaded &&
            companies.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
                {!c.isActive && (
                  <Badge variant="destructive" className="ms-2 text-[10px]">
                    inactive
                  </Badge>
                )}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
