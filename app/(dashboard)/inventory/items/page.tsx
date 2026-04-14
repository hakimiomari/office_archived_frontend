"use client";

import { useEffect, useState } from "react";
import {
  useInventory,
  Item,
  ItemCategory,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

type ItemFormData = {
  name: string;
  sku: string;
  category: ItemCategory;
  unit: string;
  description: string;
  minStock: number;
  salePrice: number;
  purchasePrice: number;
};

const emptyForm: ItemFormData = {
  name: "",
  sku: "",
  category: "OTHER",
  unit: "pcs",
  description: "",
  minStock: 0,
  salePrice: 0,
  purchasePrice: 0,
};

export default function InventoryItemsPage() {
  const { getItems, createItem, updateItem, deleteItem } = useInventory();
  const { can } = usePermission();
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | "ALL">(
    "ALL",
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const result = await getItems({
      page,
      limit,
      search: search || undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    });
    setItems(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [page, limit, categoryFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      sku: item.sku ?? "",
      category: item.category,
      unit: item.unit,
      description: item.description ?? "",
      minStock: item.minStock,
      salePrice: item.salePrice ?? 0,
      purchasePrice: item.purchasePrice ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      sku: form.sku || undefined,
      category: form.category,
      unit: form.unit || "pcs",
      description: form.description || undefined,
      minStock: Number(form.minStock) || 0,
      salePrice: Number(form.salePrice) || 0,
      purchasePrice: Number(form.purchasePrice) || 0,
    };
    const result = editingItem
      ? await updateItem(editingItem.id, payload)
      : await createItem(payload);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteItem(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetchItems();
  };

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("items")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="inventory.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newItem")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={t("searchItems")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button variant="outline" onClick={handleSearch}>
              {tCommon("search")}
            </Button>
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allCategories")}</SelectItem>
              <SelectItem value="OFFICE_SUPPLIES">{t("categoryOfficeSupplies")}</SelectItem>
              <SelectItem value="IT_EQUIPMENT">{t("categoryItEquipment")}</SelectItem>
              <SelectItem value="PROJECT_MATERIALS">{t("categoryProjectMaterials")}</SelectItem>
              <SelectItem value="CONSUMABLES">{t("categoryConsumables")}</SelectItem>
              <SelectItem value="ASSETS">{t("categoryAssets")}</SelectItem>
              <SelectItem value="OTHER">{t("categoryOther")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">#</TableHead>
                <TableHead className="px-4 py-2">{t("itemName")}</TableHead>
                <TableHead className="px-4 py-2">{t("sku")}</TableHead>
                <TableHead className="px-4 py-2">{t("category")}</TableHead>
                <TableHead className="px-4 py-2">{t("unit")}</TableHead>
                <TableHead className="px-4 py-2">{t("totalStock")}</TableHead>
                <TableHead className="px-4 py-2">{t("minStock")}</TableHead>
                <TableHead className="px-4 py-2">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noItems")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => {
                  const total = item.totalStock ?? 0;
                  const isLow = total < item.minStock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-2">
                        {((meta?.page || 1) - 1) * (meta?.limit || 10) + idx + 1}
                      </TableCell>
                      <TableCell className="px-4 py-2 font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {item.sku || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="outline">{categoryLabel[item.category]}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2">{item.unit}</TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <span className={isLow ? "font-semibold text-destructive" : ""}>
                            {total}
                          </span>
                          {isLow && (
                            <IconAlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">
                        {item.minStock}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {can("inventory.update") && (
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                <IconEdit className="me-2 h-4 w-4" />
                                {tCommon("edit")}
                              </DropdownMenuItem>
                            )}
                            {can("inventory.delete") && (
                              <DropdownMenuItem
                                onClick={() => setDeleteId(item.id)}
                                className="text-red-600"
                              >
                                <IconTrash className="me-2 h-4 w-4" />
                                {tCommon("delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {tCommon("showing")}{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")}{" "}
                {Math.min(meta.page * meta.limit, meta.total)} {tCommon("of")}{" "}
                {meta.total}
              </p>
              <Select
                value={`${limit}`}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((s) => (
                    <SelectItem key={s} value={`${s}`}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("editItem") : t("createItem")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("itemName")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">{t("sku")}</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as ItemCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE_SUPPLIES">{t("categoryOfficeSupplies")}</SelectItem>
                    <SelectItem value="IT_EQUIPMENT">{t("categoryItEquipment")}</SelectItem>
                    <SelectItem value="PROJECT_MATERIALS">{t("categoryProjectMaterials")}</SelectItem>
                    <SelectItem value="CONSUMABLES">{t("categoryConsumables")}</SelectItem>
                    <SelectItem value="ASSETS">{t("categoryAssets")}</SelectItem>
                    <SelectItem value="OTHER">{t("categoryOther")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t("unit")}</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs, kg, liter"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minStock">{t("minStock")}</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">{t("salePrice")}</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm({ ...form, salePrice: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">{t("purchasePrice")}</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, purchasePrice: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? tCommon("saving")
                  : editingItem
                    ? t("updateItem")
                    : t("createItem")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteItem")}
        description={t("deleteItemConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
