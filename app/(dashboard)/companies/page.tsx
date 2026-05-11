"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useTenantFilter } from "@/contexts/TenantFilterContext";
import { useCompanies, Company } from "@/api/hooks/use-companies";
import type { Meta } from "@/config/inventory/inventory";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";

type FormData = {
  name: string;
  slug: string;
  timezone: string;
  notes: string;
};

const empty: FormData = { name: "", slug: "", timezone: "", notes: "" };

export default function CompaniesPage() {
  const { user, loading: userLoading } = useUser();
  const { filterCompanyId } = useTenantFilter();
  const router = useRouter();
  const { list, create, update, setActive, remove } = useCompanies();
  // SUPER_ADMIN scoped into a tenant should be treated as a tenant user here
  // — no companies management while "acting as" a company.
  const isAdminUnscoped =
    user?.userRole === "SUPER_ADMIN" && filterCompanyId == null;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Page is SUPER_ADMIN-only AND the admin must be unscoped (i.e. not
  // currently impersonating a tenant via the picker). Bounce anyone else.
  useEffect(() => {
    if (userLoading || !user) return;
    if (user.userRole !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return;
    }
    if (filterCompanyId != null) {
      router.replace("/dashboard");
    }
  }, [user, userLoading, filterCompanyId, router]);

  const fetch = async () => {
    setLoading(true);
    const r = await list({ page, limit: 20, search: search || undefined });
    setCompanies(r.data);
    setMeta(r.meta);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdminUnscoped) fetch();
  }, [page, isAdminUnscoped]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug ?? "",
      timezone: c.timezone ?? "",
      notes: c.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      timezone: form.timezone || undefined,
      notes: form.notes || undefined,
    };
    const ok = editing
      ? await update(editing.id, payload)
      : await create(payload);
    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      fetch();
    }
  };

  if (!isAdminUnscoped) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Companies</h1>
          {meta && <Badge>{meta.total}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetch())}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => (setPage(1), fetch())}>
            Search
          </Button>
          <Button onClick={openCreate}>
            <IconPlus className="me-2 h-4 w-4" />
            New company
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">#</TableHead>
              <TableHead className="px-4 py-2">Name</TableHead>
              <TableHead className="px-4 py-2">Slug</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Users</TableHead>
              <TableHead className="px-4 py-2">Items</TableHead>
              <TableHead className="px-4 py-2">Sales</TableHead>
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
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
                    <IconAlertTriangle className="h-6 w-6" />
                    No companies yet — click "New company" to add one.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((c, idx) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-2">
                    {((meta?.page || 1) - 1) * 20 + idx + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    {c.name}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    {c.slug ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c._count?.users ?? 0}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c._count?.items ?? 0}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c._count?.sales ?? 0}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit"
                        onClick={() => openEdit(c)}
                      >
                        <IconEdit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={c.isActive ? "Deactivate" : "Activate"}
                        onClick={async () => {
                          if (await setActive(c.id, !c.isActive)) fetch();
                        }}
                      >
                        {c.isActive ? (
                          <IconX className="h-3 w-3 text-orange-600" />
                        ) : (
                          <IconCheck className="h-3 w-3 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <IconTrash className="h-3 w-3 text-red-600" />
                      </Button>
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

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit company" : "New company"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="acme (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={form.timezone}
                onChange={(e) =>
                  setForm({ ...form, timezone: e.target.value })
                }
                placeholder="Asia/Kabul"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete company"
        description="ALL data belonging to this company will be permanently deleted. This cannot be undone."
        onConfirm={async () => {
          if (deleteId && (await remove(deleteId))) {
            setDeleteId(null);
            fetch();
          }
        }}
      />
    </div>
  );
}
