"use client";

import { useEffect, useState } from "react";
import {
  useAlerts,
  Alert,
  AlertStatus,
  AlertType,
} from "@/config/alerts/alerts";
import type { Meta } from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconRefresh,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";

const typeColor: Record<AlertType, "default" | "destructive" | "secondary" | "outline"> = {
  LOW_STOCK: "destructive",
  OVERSTOCK: "secondary",
  DEAD_STOCK: "outline",
  REORDER: "default",
};

const statusColor: Record<AlertStatus, "default" | "destructive" | "secondary" | "outline"> = {
  OPEN: "destructive",
  ACKNOWLEDGED: "secondary",
  RESOLVED: "outline",
};

export default function AlertsPage() {
  const { list, scan, scanDeadStock, dispatch, acknowledge, resolve, remove } =
    useAlerts();
  const { can } = usePermission();
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");

  const typeLabels: Record<AlertType, string> = {
    LOW_STOCK: t("typeLowStock"),
    OVERSTOCK: t("typeOverstock"),
    DEAD_STOCK: t("typeDeadStock"),
    REORDER: t("typeReorder"),
  };
  const statusLabels: Record<AlertStatus, string> = {
    OPEN: t("statusOpen"),
    ACKNOWLEDGED: t("statusAcknowledged"),
    RESOLVED: t("statusResolved"),
  };

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<AlertType | "ALL">("ALL");
  const [status, setStatus] = useState<AlertStatus | "ALL">("OPEN");
  const [scanning, setScanning] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const r = await list({
      page,
      limit: 20,
      type: type !== "ALL" ? type : undefined,
      status: status !== "ALL" ? status : undefined,
    });
    setAlerts(r.data);
    setMeta(r.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [page, type, status]);

  const onScan = async () => {
    setScanning(true);
    await scan();
    await scanDeadStock(90);
    setScanning(false);
    fetch();
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 text-orange-500" />
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {meta && <Badge variant="default">{meta.total}</Badge>}
          </div>
          <PermissionGate permission="inventory.update">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onScan}
                disabled={scanning}
              >
                <IconRefresh className="me-2 h-4 w-4" />
                {scanning ? t("rescanning") : t("rescan")}
              </Button>
              <Button variant="outline" onClick={dispatch}>
                <IconSend className="me-2 h-4 w-4" />
                {t("dispatchOpen")}
              </Button>
            </div>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Combobox
            value={type}
            onValueChange={(v) => { setType(v as any); setPage(1); }}
            options={[
              { value: "ALL", label: t("allTypes") },
              { value: "LOW_STOCK", label: t("typeLowStock") },
              { value: "OVERSTOCK", label: t("typeOverstock") },
              { value: "DEAD_STOCK", label: t("typeDeadStock") },
              { value: "REORDER", label: t("typeReorder") },
            ]}
            placeholder={t("allTypes")}
            triggerClassName="h-9 w-[180px]"
            searchPlaceholder="Search..."
            emptyMessage="No type found."
          />
          <Combobox
            value={status}
            onValueChange={(v) => { setStatus(v as any); setPage(1); }}
            options={[
              { value: "ALL", label: t("allStatuses") },
              { value: "OPEN", label: t("statusOpen") },
              { value: "ACKNOWLEDGED", label: t("statusAcknowledged") },
              { value: "RESOLVED", label: t("statusResolved") },
            ]}
            placeholder={t("allStatuses")}
            triggerClassName="h-9 w-[180px]"
            searchPlaceholder="Search..."
            emptyMessage="No status found."
          />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">{t("columnType")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnStatus")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnItem")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnWarehouse")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnCurrent")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnThreshold")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnMessage")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnCreated")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    {t("noAlerts")}
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="px-4 py-2">
                      <Badge variant={typeColor[a.type]}>
                        {typeLabels[a.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusColor[a.status]}>{statusLabels[a.status]}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium">
                      {a.item.name}
                      {a.item.sku && (
                        <span className="text-xs text-muted-foreground ms-1">
                          ({a.item.sku})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {a.warehouse?.name ?? t("allWarehousesShort")}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {a.currentValue ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {a.threshold ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-xs">{a.message}</TableCell>
                    <TableCell className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {a.status === "OPEN" && can("inventory.update") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (await acknowledge(a.id)) fetch();
                            }}
                          >
                            <IconCheck className="h-3 w-3" />
                          </Button>
                        )}
                        {a.status !== "RESOLVED" && can("inventory.update") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (await resolve(a.id)) fetch();
                            }}
                          >
                            <IconCircleCheck className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                        {can("inventory.delete") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (await remove(a.id)) fetch();
                            }}
                          >
                            <IconTrash className="h-3 w-3 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {tCommon("previous")}
            </Button>
            <span className="text-sm">
              {tCommon("page")} {meta.page} {tCommon("of")} {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {tCommon("next")}
            </Button>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
