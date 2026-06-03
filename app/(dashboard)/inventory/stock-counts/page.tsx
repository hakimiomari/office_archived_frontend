"use client";

import { useEffect, useState } from "react";
import {
  useStockCounts,
  StockCount,
  StockCountStatus,
} from "@/config/stock-counts/stock-counts";
import { useInventory, Warehouse, Meta } from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconClipboardList,
  IconPlus,
  IconCheck,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";

const statusColor: Record<StockCountStatus, "default" | "destructive" | "secondary" | "outline"> = {
  DRAFT: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default function StockCountsPage() {
  const { list, get, create, submit, complete, cancel, remove } =
    useStockCounts();
  const { getWarehouses } = useInventory();
  const { can } = usePermission();
  const t = useTranslations("stockCounts");
  const tCommon = useTranslations("common");

  const statusLabels: Record<StockCountStatus, string> = {
    DRAFT: t("statusDraft"),
    IN_PROGRESS: t("statusInProgress"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const [counts, setCounts] = useState<StockCount[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<StockCountStatus | "ALL">(
    "ALL",
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ warehouseId: "", reference: "", notes: "" });
  const [creating, setCreating] = useState(false);

  const [activeCount, setActiveCount] = useState<StockCount | null>(null);
  const [counts2, setCounts2] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const r = await list({
      page,
      limit: 10,
      status: filterStatus !== "ALL" ? filterStatus : undefined,
    });
    setCounts(r.data);
    setMeta(r.meta);
    setLoading(false);
  };

  useEffect(() => {
    getWarehouses({ limit: 200 }).then((r) => setWarehouses(r.data));
  }, []);

  useEffect(() => {
    fetch();
  }, [page, filterStatus]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.warehouseId) return;
    setCreating(true);
    const sc = await create({
      warehouseId: Number(createForm.warehouseId),
      reference: createForm.reference || undefined,
      notes: createForm.notes || undefined,
    });
    setCreating(false);
    if (sc) {
      setCreateOpen(false);
      setCreateForm({ warehouseId: "", reference: "", notes: "" });
      const detail = await get(sc.id);
      if (detail) {
        setActiveCount(detail);
        setCounts2(
          Object.fromEntries(detail.lines!.map((l) => [l.itemId, ""])) as Record<
            number,
            string
          >,
        );
      }
      fetch();
    }
  };

  const openDetail = async (id: number) => {
    const detail = await get(id);
    if (detail) {
      setActiveCount(detail);
      setCounts2(
        Object.fromEntries(
          (detail.lines ?? []).map((l) => [l.itemId, String(l.countedQty)]),
        ) as Record<number, string>,
      );
    }
  };

  const onSubmitLines = async () => {
    if (!activeCount) return;
    setSubmitting(true);
    const lines = Object.entries(counts2)
      .filter(([, v]) => v !== "")
      .map(([itemId, v]) => ({
        itemId: Number(itemId),
        countedQty: Number(v),
      }));
    const updated = await submit(activeCount.id, lines);
    setSubmitting(false);
    if (updated) {
      setActiveCount(updated);
    }
  };

  const onComplete = async (apply: boolean) => {
    if (!activeCount) return;
    setCompleting(true);
    const lines = Object.entries(counts2)
      .filter(([, v]) => v !== "")
      .map(([itemId, v]) => ({
        itemId: Number(itemId),
        countedQty: Number(v),
      }));
    if (lines.length > 0) {
      const submitted = await submit(activeCount.id, lines);
      if (!submitted) {
        setCompleting(false);
        return;
      }
    }
    const updated = await complete(activeCount.id, apply);
    setCompleting(false);
    if (updated) {
      setActiveCount(null);
      fetch();
    }
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconClipboardList className="h-5 w-5" />
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {meta && <Badge>{meta.total}</Badge>}
          </div>
          <PermissionGate permission="inventory.create">
            <Button onClick={() => setCreateOpen(true)}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newCount")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder={tCommon("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tCommon("all")}</SelectItem>
              <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
              <SelectItem value="IN_PROGRESS">{t("statusInProgress")}</SelectItem>
              <SelectItem value="COMPLETED">{t("statusCompleted")}</SelectItem>
              <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">{t("columnReference")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnWarehouse")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnStatus")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnLines")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnStarted")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnCompleted")}</TableHead>
                <TableHead className="px-4 py-2">{t("columnActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : counts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("noCounts")}
                  </TableCell>
                </TableRow>
              ) : (
                counts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 py-2 font-medium">
                      {c.reference ?? `#${c.id}`}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {c.warehouse?.name ?? `WH ${c.warehouseId}`}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusColor[c.status]}>{statusLabels[c.status]}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {c._count?.lines ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-xs">
                      {new Date(c.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-xs">
                      {c.completedAt
                        ? new Date(c.completedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(c.id)}
                        >
                          {tCommon("open")}
                        </Button>
                        {c.status === "IN_PROGRESS" &&
                          can("inventory.update") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (await cancel(c.id)) fetch();
                              }}
                            >
                              <IconX className="h-3 w-3" />
                            </Button>
                          )}
                        {can("inventory.delete") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (await remove(c.id)) fetch();
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("create")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("columnWarehouse")}</Label>
              <Select
                value={createForm.warehouseId}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, warehouseId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectWarehouse")} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("reference")}</Label>
              <Input
                value={createForm.reference}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reference: e.target.value })
                }
                placeholder={tCommon("autoIfEmpty")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? t("creating") : tCommon("create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail / submit / complete dialog */}
      <Dialog
        open={!!activeCount}
        onOpenChange={(open) => !open && setActiveCount(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeCount?.reference ?? `#${activeCount?.id}`} —{" "}
              {activeCount?.warehouse?.name}
            </DialogTitle>
          </DialogHeader>
          {activeCount && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">{tCommon("name")}</TableHead>
                      <TableHead className="px-3 py-2">{t("columnExpected")}</TableHead>
                      <TableHead className="px-3 py-2">{t("columnCounted")}</TableHead>
                      <TableHead className="px-3 py-2">{t("columnVariance")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeCount.lines ?? []).map((l) => {
                      const counted = counts2[l.itemId] ?? "";
                      const cv = counted === "" ? l.countedQty : Number(counted);
                      const variance = cv - l.expectedQty;
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="px-3 py-2">
                            {l.item?.name ?? `#${l.itemId}`}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-muted-foreground">
                            {l.expectedQty}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            {activeCount.status === "IN_PROGRESS" ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={counted}
                                onChange={(e) =>
                                  setCounts2({
                                    ...counts2,
                                    [l.itemId]: e.target.value,
                                  })
                                }
                                className="h-8 w-24"
                              />
                            ) : (
                              l.countedQty
                            )}
                          </TableCell>
                          <TableCell
                            className={
                              "px-3 py-2 " +
                              (variance === 0
                                ? "text-muted-foreground"
                                : variance > 0
                                ? "text-green-600"
                                : "text-red-600")
                            }
                          >
                            {variance > 0 ? "+" : ""}
                            {variance}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {activeCount.status === "IN_PROGRESS" && (
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={onSubmitLines}
                    disabled={submitting}
                  >
                    {submitting ? t("saving") : t("saveCounts")}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onComplete(false)}
                      disabled={completing}
                    >
                      {t("completeNoAdjust")}
                    </Button>
                    <Button
                      onClick={() => onComplete(true)}
                      disabled={completing}
                    >
                      <IconCheck className="me-2 h-4 w-4" />
                      {t("completeAndApply")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </RouteGuard>
  );
}
