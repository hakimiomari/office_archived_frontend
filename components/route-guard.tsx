"use client";

import { usePermission } from "@/hooks/use-permission";
import { useUser } from "@/contexts/UserContext";
import { IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { nextRoute } from "@/lib/route";

interface RouteGuardProps {
  /** Required permission(s). User needs at least ONE to access. */
  permission: string | string[];
  children: React.ReactNode;
}

/**
 * Wraps a page and blocks access if user lacks required permissions.
 * Shows a 403-style message instead of the page content.
 */
export function RouteGuard({ permission, children }: RouteGuardProps) {
  const { user } = useUser();
  const { canAny } = usePermission();
  const { changeRoute } = nextRoute();

  const perms = Array.isArray(permission) ? permission : [permission];

  // While user data is loading, show nothing (avoids flash)
  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">Loading...</div>
    );
  }

  if (!canAny(...perms)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <IconLock className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="max-w-md text-center text-muted-foreground">
          You don&apos;t have the required permissions to access this page.
          Contact your administrator if you need access.
        </p>
        <Button variant="outline" onClick={() => changeRoute("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
