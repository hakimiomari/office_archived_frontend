"use client";

import { useEffect, useState } from "react";
import { useLicenses } from "@/config/license/license";
import { useLicense, LicenseType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

type LicenseFormData = {
  licenseNumber: string;
  companyName: string;
  licenseType: "SMALL" | "LARGE";
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  province: string;
  district: string;
};

const emptyForm: LicenseFormData = {
  licenseNumber: "",
  companyName: "",
  licenseType: "SMALL",
  issueDate: "",
  expiryDate: "",
  status: "ACTIVE",
  province: "",
  district: "",
};

export default function LicensesPage() {
  const { getLicenses, getLicense, createLicense, updateLicense, deleteLicense } =
    useLicenses();
  const { licenses, meta, loading } = useLicense();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseType | null>(null);
  const [form, setForm] = useState<LicenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getLicenses(page, limit, search);
  }, [page, limit]);

  const handleSearch = () => {
    setPage(1);
    getLicenses(1, limit, search);
  };

  const openCreate = () => {
    setEditingLicense(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const lic = await getLicense(id);
    if (lic) {
      setEditingLicense(lic);
      setForm({
        licenseNumber: lic.licenseNumber,
        companyName: lic.companyName,
        licenseType: lic.licenseType,
        issueDate: new Date(lic.issueDate).toISOString().split("T")[0],
        expiryDate: new Date(lic.expiryDate).toISOString().split("T")[0],
        status: lic.status,
        province: lic.province,
        district: lic.district,
      });
      setDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (editingLicense) {
      result = await updateLicense(editingLicense.id, form);
    } else {
      result = await createLicense(form);
    }
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      getLicenses(page, limit, search);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteLicense(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) getLicenses(page, limit, search);
  };

  const handleChange = (field: keyof LicenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "EXPIRED":
        return "destructive";
      case "SUSPENDED":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <RouteGuard permission="license.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mining Licenses</h1>
          <PermissionGate permission="license.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              New License
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by license number, company, or province..."
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
                <TableHead className="px-4 py-2">License No.</TableHead>
                <TableHead className="px-4 py-2">Company</TableHead>
                <TableHead className="px-4 py-2">Type</TableHead>
                <TableHead className="px-4 py-2">Status</TableHead>
                <TableHead className="px-4 py-2">Province</TableHead>
                <TableHead className="px-4 py-2">Issue Date</TableHead>
                <TableHead className="px-4 py-2">Expiry Date</TableHead>
                <TableHead className="px-4 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="px-4 py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No licenses found.
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((lic: LicenseType, index: number) => (
                  <TableRow key={lic.id}>
                    <TableCell className="px-4 py-2">
                      {((meta?.page || 1) - 1) * (meta?.limit || 10) + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium">
                      {lic.licenseNumber}
                    </TableCell>
                    <TableCell className="px-4 py-2">{lic.companyName}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant="outline">{lic.licenseType}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusColor(lic.status)}>{lic.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">{lic.province}</TableCell>
                    <TableCell className="px-4 py-2">
                      {new Date(lic.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {new Date(lic.expiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => changeRoute(`/licenses/${lic.id}`)}
                          >
                            <IconEye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {can("license.update") && (
                            <DropdownMenuItem onClick={() => openEdit(lic.id)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {can("license.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(lic.id)}
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
                Showing {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">| Rows per page:</span>
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
                    {[10, 20, 50, 100, 500, 1000].map((size) => (
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

      {/* Create / Edit License Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? "Edit License" : "Create New License"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => handleChange("licenseNumber", e.target.value)}
                  placeholder="LIC-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Mining Corp"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>License Type</Label>
                <Select
                  value={form.licenseType}
                  onValueChange={(v) => handleChange("licenseType", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small Scale</SelectItem>
                    <SelectItem value="LARGE">Large Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => handleChange("issueDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={form.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                  placeholder="Kabul"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder="District 1"
                  required
                />
              </div>
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
                  : editingLicense
                    ? "Update License"
                    : "Create License"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete License"
        description="This will permanently delete this license and all its associated contracts. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
