"use client";

import { useUser } from "@/contexts/UserContext";

/**
 * Hook to check user permissions.
 *
 * Backed by a `Set<string>` in UserContext, so every check below is O(1).
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermission();
 *   if (can("license.create")) { ... }
 *   if (canAny("license.create", "license.update")) { ... }
 */
export function usePermission() {
  const { permissions } = useUser();

  const can = (permission: string): boolean => {
    return permissions.has(permission);
  };

  const canAny = (...perms: string[]): boolean => {
    return perms.some((p) => permissions.has(p));
  };

  const canAll = (...perms: string[]): boolean => {
    return perms.every((p) => permissions.has(p));
  };

  return { can, canAny, canAll, permissions };
}
