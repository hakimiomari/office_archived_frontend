"use client";

import { useEffect, useState } from "react";
import {
  useCategories,
  Category,
  CategoryNode,
} from "@/config/categories/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

type FormData = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  const out: { node: CategoryNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children && n.children.length) {
      out.push(...flatten(n.children, depth + 1));
    }
  }
  return out;
}

export default function CategoriesPage() {
  const { tree, list, create, update, remove } = useCategories();
  const { can } = usePermission();
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");

  const [nodes, setNodes] = useState<CategoryNode[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [treeRes, listRes] = await Promise.all([tree(), list({ limit: 500 })]);
    setNodes(treeRes);
    setFlat(listRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = (parent?: Category) => {
    setEditing(null);
    setForm({ ...emptyForm, parentId: parent ? String(parent.id) : "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug ?? "",
      description: c.description ?? "",
      parentId: c.parentId != null ? String(c.parentId) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      parentId: form.parentId === "" ? undefined : Number(form.parentId),
    };
    const ok = editing
      ? await update(editing.id, {
          ...payload,
          parentId: form.parentId === "" ? null : Number(form.parentId),
        })
      : await create(payload);
    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      fetchAll();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await remove(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetchAll();
  };

  const rows = flatten(nodes);

  return (
    <RouteGuard permission="inventory.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <Badge variant="default">{flat.length}</Badge>
          </div>
          <PermissionGate permission="inventory.create">
            <Button onClick={() => openCreate()}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newCategory")}
            </Button>
          </PermissionGate>
        </div>

        <div className="rounded-md border bg-card">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("noCategories")}
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map(({ node, depth }) => (
                <li
                  key={node.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ paddingInlineStart: depth * 20 }}
                  >
                    {depth > 0 && (
                      <IconChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="font-medium">{node.name}</span>
                    {node.slug && (
                      <span className="text-xs text-muted-foreground">
                        /{node.slug}
                      </span>
                    )}
                    {node._count?.items ? (
                      <Badge variant="outline" className="ms-2 text-xs">
                        {node._count.items} {t("itemsLabel")}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {can("inventory.create") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreate(node)}
                      >
                        <IconPlus className="h-3 w-3" />
                      </Button>
                    )}
                    {can("inventory.update") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(node)}
                      >
                        <IconEdit className="h-3 w-3" />
                      </Button>
                    )}
                    {can("inventory.delete") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(node.id)}
                      >
                        <IconTrash className="h-3 w-3 text-red-600" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editCategory") : t("newCategory")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={t("slugPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("parent")}</Label>
              <Combobox
                value={form.parentId === "" ? "NONE" : form.parentId}
                onValueChange={(v) =>
                  setForm({ ...form, parentId: v === "NONE" ? "" : v })
                }
                options={[
                  { value: "NONE", label: tCommon("topLevelOption") },
                  ...flat
                    .filter((c) => !editing || c.id !== editing.id)
                    .map((c) => ({
                      value: String(c.id),
                      label: `${c.parent ? `${c.parent.name} › ` : ""}${c.name}`,
                    })),
                ]}
                searchPlaceholder="Search categories..."
                emptyMessage="No category found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? tCommon("saving")
                  : editing
                    ? tCommon("update")
                    : tCommon("create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
