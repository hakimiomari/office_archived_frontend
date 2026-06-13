"use client";

import api from "../lib/api/axios";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type UserRoleName = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_USER";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profile_picture?: string;
  userRole?: UserRoleName;
  companyId?: number | null;
  company?: { id: number; name: string; slug: string | null } | null;
  roles?: { id: number; name: string; permissions?: { id: number; name: string }[] }[];
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  /**
   * Set of permission strings the user holds, derived from all assigned
   * roles. Lookups are O(1) — see `usePermission()` for the public API.
   */
  permissions: Set<string>;
  roles: string[];
  loading: boolean;
  fetchProfile: () => Promise<User | null>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const EMPTY_PERMISSIONS: Set<string> = new Set();

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(EMPTY_PERMISSIONS);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchProfile = async (): Promise<User | null> => {
    try {
      const response = await api.get("user/profile");
      const userData: User = response.data.user;
      setUser(userData);

      // Extract permissions from all roles into a Set so the hot path
      // (`permissions.has('inventory.read')`) is O(1). Previously this
      // was a string[] with .includes() — O(n) per check, slow when a
      // page has 20+ <PermissionGate> components.
      if (userData.roles) {
        const allPerms = userData.roles.flatMap(
          (r: any) => r.permissions?.map((p: any) => p.name) || []
        );
        setPermissions(new Set<string>(allPerms as string[]));
        setRoles(userData.roles.map((r: any) => r.name));
      }
      return userData;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Routes that don't require an authenticated session. On these pages
  // we skip the `/user/profile` fetch entirely — otherwise an
  // unauthenticated visitor hits 401, the axios interceptor's refresh
  // fails, and `forceLogout()` kicks them to /login (which makes
  // /signup unreachable for new users).
  const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

  useEffect(() => {
    if (!PUBLIC_ROUTES.has(pathname)) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, permissions, roles, loading, fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
