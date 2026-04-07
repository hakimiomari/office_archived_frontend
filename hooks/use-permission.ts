"use client";

import { useUser } from "@/contexts/UserContext";

/**
 * Hook to check user permissions.
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermission();
 *   if (can("license.create")) { ... }
 *   if (canAny("license.create", "license.update")) { ... }
 */
export function usePermission() {
  const { permissions } = useUser();

  const can = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const canAny = (...perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const canAll = (...perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return { can, canAny, canAll, permissions };
}
