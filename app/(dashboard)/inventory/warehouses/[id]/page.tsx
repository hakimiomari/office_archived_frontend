"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  useInventory,
  Item,
  InventoryStock,
  Warehouse,
  ItemCategory,
} from "@/config/inventory/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconBuildingWarehouse,
  IconPackage,
  IconChartBar,
  IconCash,
} from "@tabler/icons-react";
import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { useTranslations } from "next-intl";

type Row = InventoryStock & { item: Item };

export default function WarehouseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { getWarehouse } = useInventory();
  const { changeRoute } = nextRoute();
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | "ALL">(
    "ALL",
  );
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW" | "ZERO" | "OK">(
    "ALL",
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getWarehouse(id).then((w) => {
      if (w) {
        setWarehouse(w);
        setRows(w.stocks ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== "ALL" && r.item.category !== categoryFilter) return false;
      if (stockFilter === "ZERO" && r.quantity > 0) return false;
      if (stockFilter === "LOW" && !(r.quantity > 0 && r.quantity < r.item.minStock)) return false;
      if (stockFilter === "OK" && r.quantity < r.item.minStock) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.item.name.toLowerCase().includes(q) ||
          (r.item.sku ?? "").toLowerCase().includes(q) ||
          (r.item.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, categoryFilter, stockFilter]);

  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
    const stockValue = rows.reduce(
      (s, r) => s + r.quantity * (r.item.purchasePrice ?? 0),
      0,
    );
    const lowCount = rows.filter(
      (r) => r.quantity > 0 && r.quantity < r.item.minStock,
    ).length;
    const zeroCount = rows.filter((r) => r.quantity <= 0).length;
    return { totalQty, stockValue, lowCount, zeroCount };
  }, [rows]);

  const categoryLabel: Record<ItemCategory, string> = {
    OFFICE_SUPPLIES: t("categoryOfficeSupplies"),
    IT_EQUIPMENT: t("categoryItEquipment"),
    PROJECT_MATERIALS: t("categoryProjectMaterials"),
    CONSUMABLES: t("categoryConsumables"),
    ASSETS: t("categoryAssets"),
    OTHER: t("categoryOther"),
  };

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeRoute("/inventory/warehouses")}
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <IconBuildingWarehouse className="h-5 w-5 text-blue-600" />
          {loading ? (
            <Skeleton className="h-7 w-48" />
          ) : warehouse ? (
            <div>
              <h1 className="text-2xl font-bold">{warehouse.name}</h1>
              {warehouse.location && (
                <p className="text-xs text-muted-foreground">
                  {warehouse.location}
                </p>
              )}
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-muted-foreground">
              {t("warehouseNotFound")}
            </h1>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard
            icon={<IconPackage className="h-5 w-5 text-primary" />}
            label={t("distinctItems")}
            value={loading ? null : rows.length}
          />
          <SummaryCard
            icon={<IconChartBar className="h-5 w-5 text-blue-600" />}
            label={t("totalQuantity")}
            value={loading ? null : totals.totalQty}
          />
          <SummaryCard
            icon={<IconCash className="h-5 w-5 text-green-600" />}
            label={t("stockValue")}
            value={
              loading ? null : totals.stockValue.toFixed(2)
            }
          />
          <SummaryCard
            icon={<IconAlertTriangle className="h-5 w-5 text-orange-600" />}
            label={t("lowOutShort")}
            value={loading ? null : `${totals.lowCount} / ${totals.zeroCount}`}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Input
            placeholder={t("searchItems")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Combobox
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as any)}
              options={[
                { value: "ALL", label: t("allCategories") },
                { value: "OFFICE_SUPPLIES", label: t("categoryOfficeSupplies") },
                { value: "IT_EQUIPMENT", label: t("categoryItEquipment") },
                { value: "PROJECT_MATERIALS", label: t("categoryProjectMaterials") },
                { value: "CONSUMABLES", label: t("categoryConsumables") },
                { value: "ASSETS", label: t("categoryAssets") },
                { value: "OTHER", label: t("categoryOther") },
              ]}
              triggerClassName="h-9 w-[180px]"
              searchPlaceholder="Search..."
              emptyMessage="No category found."
            />
            <Combobox
              value={stockFilter}
              onValueChange={(v) => setStockFilter(v as any)}
              options={[
                { value: "ALL", label: t("allStockLevels") },
                { value: "OK", label: t("inStock") },
                { value: "LOW", label: t("lowStockAlert") },
                { value: "ZERO", label: t("outOfStock") },
              ]}
              triggerClassName="h-9 w-[160px]"
              searchPlaceholder="Search..."
              emptyMessage="No status found."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">#</TableHead>
                <TableHead className="px-4 py-2">{t("itemName")}</TableHead>
                <TableHead className="px-4 py-2">{t("sku")}</TableHead>
                <TableHead className="px-4 py-2">{t("category")}</TableHead>
                <TableHead className="px-4 py-2">{t("unit")}</TableHead>
                <TableHead className="px-4 py-2">{t("qtyHere")}</TableHead>
                <TableHead className="px-4 py-2">{t("minStock")}</TableHead>
                <TableHead className="px-4 py-2">{t("maxStock")}</TableHead>
                <TableHead className="px-4 py-2">{t("reorderPoint")}</TableHead>
                <TableHead className="px-4 py-2">{t("purchasePrice")}</TableHead>
                <TableHead className="px-4 py-2">{t("salePrice")}</TableHead>
                <TableHead className="px-4 py-2">{t("lineValue")}</TableHead>
                <TableHead className="px-4 py-2">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 13 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-24 text-center">
                    {t("noItemsFilter")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => {
                  const isLow =
                    r.quantity > 0 && r.quantity < r.item.minStock;
                  const isZero = r.quantity <= 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 py-2">{idx + 1}</TableCell>
                      <TableCell className="px-4 py-2 font-medium">
                        {r.item.name}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.sku || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline">
                          {categoryLabel[r.item.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2">{r.item.unit}</TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              isZero
                                ? "font-semibold text-destructive"
                                : isLow
                                ? "font-semibold text-orange-600"
                                : "font-medium"
                            }
                          >
                            {r.quantity}
                          </span>
                          {(isLow || isZero) && (
                            <IconAlertTriangle
                              className={
                                "h-3 w-3 " +
                                (isZero
                                  ? "text-destructive"
                                  : "text-orange-600")
                              }
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.minStock}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.maxStock ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.reorderPoint ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.purchasePrice?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {r.item.salePrice?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {(r.quantity * (r.item.purchasePrice ?? 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            changeRoute(`/inventory/items?search=${encodeURIComponent(r.item.sku ?? r.item.name)}`)
                          }
                        >
                          {tCommon("open")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </RouteGuard>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="text-xl font-bold">
            {value === null ? <Skeleton className="h-6 w-12" /> : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
