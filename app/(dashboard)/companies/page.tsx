"use client";

import { useEffect, useState, useCallback } from "react";
import { useCompanies, Company, CompanyMeta } from "@/config/company/company";
import { nextRoute } from "@/lib/route";
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
  IconEye,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";

type CompanyFormData = {
  licenseNumber: string;
  TIN: string;
  address: string;
};

const emptyForm: CompanyFormData = {
  licenseNumber: "",
  TIN: "",
  address: "",
};

export default function CompaniesPage() {
  const {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<CompanyMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (p = page, l = limit, s = search) => {
      setLoading(true);
      const { data, meta } = await getCompanies(p, l, s);
      setCompanies(data);
      setMeta(meta);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, limit]
  );

  useEffect(() => {
    load(page, limit, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearch = () => {
    setPage(1);
    load(1, limit, search);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const c = await getCompany(id);
    if (c) {
      setEditing(c);
      setForm({
        licenseNumber: c.licenseNumber,
        TIN: c.TIN,
        address: c.address,
      });
      setDialogOpen(true);
    }
  };

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = editing
      ? await updateCompany(editing.id, form)
      : await createCompany(form);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      load(page, limit, search);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteCompany(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) load(page, limit, search);
  };

  return (
    <RouteGuard permission="company.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Companies</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="company.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Company
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by license number, TIN or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">#</TableHead>
                <TableHead className="px-4 py-2">License Number</TableHead>
                <TableHead className="px-4 py-2">TIN</TableHead>
                <TableHead className="px-4 py-2">Address</TableHead>
                <TableHead className="px-4 py-2">Owners</TableHead>
                <TableHead className="px-4 py-2">Contracts</TableHead>
                <TableHead className="px-4 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((c, index) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 py-2">
                      {((meta?.page || 1) - 1) * (meta?.limit || 10) +
                        index +
                        1}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-mono text-xs">
                      {c.licenseNumber}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-mono text-xs">
                      {c.TIN}
                    </TableCell>
                    <TableCell className="px-4 py-2">{c.address}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant="outline">
                        {c.owners?.length ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant="outline">
                        {c._count?.contracts ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              changeRoute(`/companies/${c.id}`)
                            }
                          >
                            <IconEye className="mr-2 h-4 w-4" />
                            View / Owners
                          </DropdownMenuItem>
                          {can("company.update") && (
                            <DropdownMenuItem
                              onClick={() => openEdit(c.id)}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {can("company.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(c.id)}
                              className="text-red-600"
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | Rows per page:
                </span>
                <Select
                  value={`${limit}`}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100, 500].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <IconChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Company" : "Create Company"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) =>
                  handleChange("licenseNumber", e.target.value)
                }
                placeholder="LIC-2026-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="TIN">TIN</Label>
              <Input
                id="TIN"
                value={form.TIN}
                onChange={(e) => handleChange("TIN", e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Kabul, Afghanistan"
                required
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
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Company"
                    : "Create Company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Company"
        description="This will permanently delete the company along with its owners and contracts. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
