"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import {
  type FeatureCode,
  type ModuleCode,
} from "@/contexts/SubscriptionContext";

type CommonProps = {
  children: ReactNode;
  /** Rendered when the gate denies access. Defaults to rendering nothing. */
  fallback?: ReactNode;
  /**
   * When true, renders the fallback even if the snapshot hasn't loaded
   * yet. Useful at the top of layouts; usually leave as false so a
   * still-loading hook shows nothing rather than the fallback.
   */
  showFallbackWhileLoading?: boolean;
};

/**
 * Renders children only if the active subscription includes the given
 * module. Mirror of the backend SubscriptionModuleGuard so the UI can
 * hide modules entirely (sidebar items, dashboard cards, etc.) rather
 * than letting the user hit a 403.
 */
export function ModuleGate({
  module,
  children,
  fallback = null,
  showFallbackWhileLoading = false,
}: CommonProps & { module: ModuleCode }) {
  const { canAccessModule, ready } = useSubscription();
  if (!ready && !showFallbackWhileLoading) return null;
  return canAccessModule(module) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Same shape as ModuleGate but for a premium feature inside an
 * already-enabled module. Useful for hiding individual buttons (e.g.
 * "Export PDF") on plans that don't have the feature.
 */
export function FeatureGate({
  feature,
  children,
  fallback = null,
  showFallbackWhileLoading = false,
}: CommonProps & { feature: FeatureCode }) {
  const { canAccessFeature, ready } = useSubscription();
  if (!ready && !showFallbackWhileLoading) return null;
  return canAccessFeature(feature) ? <>{children}</> : <>{fallback}</>;
}
