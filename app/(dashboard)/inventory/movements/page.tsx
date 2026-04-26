"use client";

import { useEffect, useState } from "react";
import {
  useInventory,
  StockMovement,
  StockMovementType,
  Item,
  Warehouse,
  Meta,
} from "@/config/inventory/inventory";
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
  IconArrowDown,
  IconArrowUp,
  IconArrowsExchange,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";

type OpType = "IN" | "OUT" | "TRANSFER";

export default function MovementsPage() {
  const {
    getMovements,
    getItems,
    getWarehouses,
    stockIn,
    stockOut,
    stockTransfer,
  } = useInventory();
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [typeFilter, setTypeFilter] = useState<StockMovementType | "ALL">("ALL");

  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [dialogOp, setDialogOp] = useState<OpType | null>(null);
  const [form, setForm] = useState({
    itemId: "",
    sourceWarehouseId: "",
    targetWarehouseId: "",
    quantity: "",
    unitCost: "",
    batchNo: "",
    expiryDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchMovements = async () => {
    setLoading(true);
    const result = await getMovements({
      page,
      limit,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
    });
    setMovements(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
  }, [page, typeFilter]);

  useEffect(() => {
    (async () => {
      const [itemsRes, whRes] = await Promise.all([
        getItems({ limit: 500 }),
        getWarehouses({ limit: 200 }),
      ]);
      setItems(itemsRes.data);
      setWarehouses(whRes.data);
    })();
  }, []);

  const openDialog = (op: OpType) => {
    setDialogOp(op);
    setForm({
      itemId: "",
      sourceWarehouseId: "",
      targetWarehouseId: "",
      quantity: "",
      unitCost: "",
      batchNo: "",
      expiryDate: "",
      notes: "",
    });
  };

  // Idempotency key — generated once per dialog open so accidental
  // double-submits collapse to a single movement on the backend.
  const newKey = () =>
    `mv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let ok = false;
    const idempotencyKey = newKey();
    const base = {
      itemId: Number(form.itemId),
      quantity: Number(form.quantity),
      notes: form.notes || undefined,
    };
    if (dialogOp === "IN") {
      ok = await stockIn({
        ...base,
        targetWarehouseId: Number(form.targetWarehouseId),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        batchNo: form.batchNo || undefined,
        expiryDate: form.expiryDate || undefined,
        idempotencyKey,
      });
    } else if (dialogOp === "OUT") {
      ok = await stockOut({
        ...base,
        sourceWarehouseId: Number(form.sourceWarehouseId),
        idempotencyKey,
      });
    } else if (dialogOp === "TRANSFER") {
      ok = await stockTransfer({
        ...base,
        sourceWarehouseId: Number(form.sourceWarehouseId),
        targetWarehouseId: Number(form.targetWarehouseId),
      });
    }
    setSaving(false);
    if (ok) {
      setDialogOp(null);
      fetchMovements();
    }
  };

  const typeVariant = (type: StockMovementType) => {
    switch (type) {
      case "IN": return "default";
      case "OUT": return "destructive";
      case "TRANSFER": return "secondary";
      default: return "outline";
    }
  };

  const typeLabel = (type: StockMovementType) => {
    return type === "IN" ? t("stockIn")
      : type === "OUT" ? t("stockOut")
      : type === "TRANSFER" ? t("stockTransfer")
      : t("stockAdjustment");
  };

  const dialogTitle = () => {
    if (dialogOp === "IN") return t("addStock");
    if (dialogOp === "OUT") return t("removeStock");
    if (dialogOp === "TRANSFER") return t("transferStock");
    return "";
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("movements")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="inventory.movement">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openDialog("IN")}>
                <IconArrowDown className="me-2 h-4 w-4 text-green-600" />
                {t("stockIn")}
              </Button>
              <Button variant="outline" onClick={() => openDialog("OUT")}>
                <IconArrowUp className="me-2 h-4 w-4 text-red-600" />
                {t("stockOut")}
              </Button>
              <Button variant="outline" onClick={() => openDialog("TRANSFER")}>
                <IconArrowsExchange className="me-2 h-4 w-4 text-blue-600" />
                {t("stockTransfer")}
              </Button>
            </div>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(1); }}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allTypes")}</SelectItem>
              <SelectItem value="IN">{t("stockIn")}</SelectItem>
              <SelectItem value="OUT">{t("stockOut")}</SelectItem>
              <SelectItem value="TRANSFER">{t("stockTransfer")}</SelectItem>
              <SelectItem value="ADJUSTMENT">{t("stockAdjustment")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">#</TableHead>
                <TableHead className="px-4 py-2">{t("movementType")}</TableHead>
                <TableHead className="px-4 py-2">{t("item")}</TableHead>
                <TableHead className="px-4 py-2">{t("quantity")}</TableHead>
                <TableHead className="px-4 py-2">Unit cost</TableHead>
                <TableHead className="px-4 py-2">Batch</TableHead>
                <TableHead className="px-4 py-2">{t("sourceWarehouse")}</TableHead>
                <TableHead className="px-4 py-2">{t("targetWarehouse")}</TableHead>
                <TableHead className="px-4 py-2">{tCommon("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    {t("noMovements")}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell className="px-4 py-2">
                      {((meta?.page || 1) - 1) * (meta?.limit || 20) + idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={typeVariant(m.type)}>{typeLabel(m.type)}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium">
                      {m.item?.name ?? `#${m.itemId}`}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {m.quantity} {m.item?.unit ?? ""}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {m.unitCost != null ? m.unitCost.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {m.batchId ? `#${m.batchId}` : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {m.sourceWarehouse?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-muted-foreground">
                      {m.targetWarehouse?.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString()}
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
              <IconChevronLeft className="h-4 w-4" />
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
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!dialogOp} onOpenChange={(open) => !open && setDialogOp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle()}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("item")}</Label>
              <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectItem")} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name} {i.sku ? `(${i.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(dialogOp === "OUT" || dialogOp === "TRANSFER") && (
              <div className="space-y-2">
                <Label>{t("sourceWarehouse")}</Label>
                <Select
                  value={form.sourceWarehouseId}
                  onValueChange={(v) => setForm({ ...form, sourceWarehouseId: v })}
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
            )}

            {(dialogOp === "IN" || dialogOp === "TRANSFER") && (
              <div className="space-y-2">
                <Label>{t("targetWarehouse")}</Label>
                <Select
                  value={form.targetWarehouseId}
                  onValueChange={(v) => setForm({ ...form, targetWarehouseId: v })}
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
            )}

            <div className="space-y-2">
              <Label htmlFor="qty">{t("quantity")}</Label>
              <Input
                id="qty"
                type="number"
                min="0.0001"
                step="0.0001"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>

            {dialogOp === "IN" && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit cost</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="defaults to purchasePrice"
                      value={form.unitCost}
                      onChange={(e) =>
                        setForm({ ...form, unitCost: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchNo">Batch / lot</Label>
                    <Input
                      id="batchNo"
                      placeholder="optional"
                      value={form.batchNo}
                      onChange={(e) =>
                        setForm({ ...form, batchNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) =>
                        setForm({ ...form, expiryDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOp(null)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tCommon("saving") : tCommon("submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </RouteGuard>
  );
}
