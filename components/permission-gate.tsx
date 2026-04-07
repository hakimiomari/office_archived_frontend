"use client";

import { usePermission } from "@/hooks/use-permission";

interface PermissionGateProps {
  /** Required permission(s). Shows children if user has ANY of them. */
  permission: string | string[];
  /** If true, requires ALL permissions instead of ANY. */
  requireAll?: boolean;
  /** Fallback content when permission denied (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children based on user permissions.
 *
 * Usage:
 *   <PermissionGate permission="license.create">
 *     <Button>Create License</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate permission={["license.update", "license.delete"]} requireAll>
 *     <AdminPanel />
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermission();

  const perms = Array.isArray(permission) ? permission : [permission];

  const allowed = requireAll ? canAll(...perms) : canAny(...perms);

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
