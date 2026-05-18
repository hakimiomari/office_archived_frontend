"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCompanies, Company, Owner } from "@/config/company/company";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getCompany, addOwner, updateOwner, deleteOwner } = useCompanies();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Owner dialog state
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [ownerForm, setOwnerForm] = useState({
    name: "",
    position: "",
    shareAmount: "",
  });
  const [savingOwner, setSavingOwner] = useState(false);

  // Delete owner state
  const [deleteOwnerId, setDeleteOwnerId] = useState<string | null>(null);
  const [deletingOwner, setDeletingOwner] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getCompany(id);
    setCompany(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openAddOwner = () => {
    setEditingOwner(null);
    setOwnerForm({ name: "", position: "", shareAmount: "" });
    setOwnerDialogOpen(true);
  };

  const openEditOwner = (owner: Owner) => {
    setEditingOwner(owner);
    setOwnerForm({
      name: owner.name,
      position: owner.position,
      shareAmount: String(owner.shareAmount),
    });
    setOwnerDialogOpen(true);
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOwner(true);
    const payload = {
      name: ownerForm.name,
      position: ownerForm.position,
      shareAmount: Number(ownerForm.shareAmount),
    };
    const result = editingOwner
      ? await updateOwner(id, editingOwner.id, payload)
      : await addOwner(id, payload);
    setSavingOwner(false);
    if (result) {
      setOwnerDialogOpen(false);
      fetchData();
    }
  };

  const handleDeleteOwner = async () => {
    if (!deleteOwnerId) return;
    setDeletingOwner(true);
    const success = await deleteOwner(id, deleteOwnerId);
    setDeletingOwner(false);
    setDeleteOwnerId(null);
    if (success) fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center p-12">
        Company not found
      </div>
    );
  }

  const totalShare = (company.owners ?? []).reduce(
    (sum, o) => sum + Number(o.shareAmount),
    0
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeRoute("/companies")}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Company Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-base">{company.name}</span>
            <Badge variant="outline" className="font-mono">
              {company.licenseNumber}
            </Badge>
            <Badge variant="outline">TIN: {company.TIN}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{company.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="font-medium">{company.licenseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TIN</p>
              <p className="font-medium">{company.TIN}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{company.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Licenses</p>
              <p className="font-medium">
                {company.miningLicense?.length ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Owners
              <Badge variant="outline">
                Total share: {totalShare}
              </Badge>
            </CardTitle>
            <PermissionGate permission="owner.create">
              <Button size="sm" onClick={openAddOwner}>
                <IconPlus className="me-2 h-4 w-4" />
                Add Owner
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          {(company.owners ?? []).length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No owners yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">#</TableHead>
                  <TableHead className="px-4 py-2">Name</TableHead>
                  <TableHead className="px-4 py-2">Position</TableHead>
                  <TableHead className="px-4 py-2">Share Amount</TableHead>
                  <TableHead className="px-4 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(company.owners ?? []).map((owner, index) => (
                  <TableRow key={owner.id}>
                    <TableCell className="px-4 py-2">{index + 1}</TableCell>
                    <TableCell className="px-4 py-2">{owner.name}</TableCell>
                    <TableCell className="px-4 py-2">{owner.position}</TableCell>
                    <TableCell className="px-4 py-2">
                      {String(owner.shareAmount)}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {can("owner.update") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditOwner(owner)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        )}
                        {can("owner.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => setDeleteOwnerId(owner.id)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={ownerDialogOpen} onOpenChange={setOwnerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOwner ? "Edit Owner" : "Add Owner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOwnerSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Name</Label>
              <Input
                id="ownerName"
                value={ownerForm.name}
                onChange={(e) =>
                  setOwnerForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ahmad Khan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPosition">Position</Label>
              <Input
                id="ownerPosition"
                value={ownerForm.position}
                onChange={(e) =>
                  setOwnerForm((p) => ({ ...p, position: e.target.value }))
                }
                placeholder="Director"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareAmount">Share Amount</Label>
              <Input
                id="shareAmount"
                type="number"
                step="0.01"
                min="0"
                value={ownerForm.shareAmount}
                onChange={(e) =>
                  setOwnerForm((p) => ({
                    ...p,
                    shareAmount: e.target.value,
                  }))
                }
                placeholder="50.00"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOwnerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingOwner}>
                {savingOwner
                  ? "Saving..."
                  : editingOwner
                    ? "Update Owner"
                    : "Add Owner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteOwnerId}
        onOpenChange={(open) => !open && setDeleteOwnerId(null)}
        title="Remove Owner"
        description="This will permanently remove this owner from the company."
        onConfirm={handleDeleteOwner}
        loading={deletingOwner}
      />
    </div>
  );
}
