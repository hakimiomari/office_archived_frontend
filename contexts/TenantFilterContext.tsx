"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/**
 * Per-browser SUPER_ADMIN company filter. When set to a non-null number,
 * every API call attaches `?companyId=N` so the backend scopes that admin's
 * view to a single tenant. Persisted in localStorage so the choice survives
 * reloads.
 *
 * For COMPANY_ADMIN / COMPANY_USER this context is unused (the JWT already
 * carries their companyId — the backend ignores any client-provided value).
 */
type TenantFilterContextType = {
  filterCompanyId: number | null;
  filterCompanyName: string | null;
  /** Set both id and name together when the user picks from the dropdown. */
  setFilterCompany: (id: number | null, name?: string | null) => void;
  /** Legacy setter kept for backwards compatibility — clears the name cache. */
  setFilterCompanyId: (id: number | null) => void;
};

const TenantFilterContext = createContext<TenantFilterContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "superAdminCompanyId";
const NAME_STORAGE_KEY = "superAdminCompanyName";

export function TenantFilterProvider({ children }: { children: ReactNode }) {
  const [filterCompanyId, setFilterCompanyIdState] = useState<number | null>(
    null,
  );
  const [filterCompanyName, setFilterCompanyNameState] = useState<
    string | null
  >(null);

  // Load on mount.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && raw !== "null") setFilterCompanyIdState(Number(raw));
      const name = window.localStorage.getItem(NAME_STORAGE_KEY);
      if (name) setFilterCompanyNameState(name);
    } catch {
      // ignore — quota / privacy mode
    }
  }, []);

  const setFilterCompany = (id: number | null, name?: string | null) => {
    setFilterCompanyIdState(id);
    setFilterCompanyNameState(name ?? null);
    try {
      if (id == null) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(NAME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, String(id));
        if (name) window.localStorage.setItem(NAME_STORAGE_KEY, name);
        else window.localStorage.removeItem(NAME_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  const setFilterCompanyId = (id: number | null) => setFilterCompany(id, null);

  return (
    <TenantFilterContext.Provider
      value={{
        filterCompanyId,
        filterCompanyName,
        setFilterCompany,
        setFilterCompanyId,
      }}
    >
      {children}
    </TenantFilterContext.Provider>
  );
}

export function useTenantFilter() {
  const ctx = useContext(TenantFilterContext);
  if (!ctx)
    throw new Error("useTenantFilter must be used within TenantFilterProvider");
  return ctx;
}

/**
 * Read the current filter without subscribing to the React context — used by
 * the axios request interceptor (which can't easily call hooks).
 */
export function readTenantFilterFromStorage(): number | null {
  try {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (!raw || raw === "null") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
