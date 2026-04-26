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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <h1 className="text-2xl font-bold">Alerts</h1>
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
                {scanning ? "Scanning..." : "Re-scan"}
              </Button>
              <Button variant="outline" onClick={dispatch}>
                <IconSend className="me-2 h-4 w-4" />
                Dispatch open
              </Button>
            </div>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={type} onValueChange={(v) => { setType(v as any); setPage(1); }}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="LOW_STOCK">Low stock</SelectItem>
              <SelectItem value="OVERSTOCK">Overstock</SelectItem>
              <SelectItem value="DEAD_STOCK">Dead stock</SelectItem>
              <SelectItem value="REORDER">Reorder</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">Type</TableHead>
                <TableHead className="px-4 py-2">Status</TableHead>
                <TableHead className="px-4 py-2">Item</TableHead>
                <TableHead className="px-4 py-2">Warehouse</TableHead>
                <TableHead className="px-4 py-2">Current</TableHead>
                <TableHead className="px-4 py-2">Threshold</TableHead>
                <TableHead className="px-4 py-2">Message</TableHead>
                <TableHead className="px-4 py-2">Created</TableHead>
                <TableHead className="px-4 py-2">Actions</TableHead>
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
                    No alerts.
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="px-4 py-2">
                      <Badge variant={typeColor[a.type]}>
                        {a.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusColor[a.status]}>{a.status}</Badge>
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
                      {a.warehouse?.name ?? "all"}
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
              Previous
            </Button>
            <span className="text-sm">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
