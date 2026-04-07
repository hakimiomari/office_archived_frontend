"use client";

import { useEffect, useState } from "react";
import { useRoles, RoleType, PermissionType } from "@/config/users/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";

export default function RolesPage() {
  const { getRoles, createRole, updateRole, deleteRole, getPermissions } =
    useRoles();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [permissions, setPermissions] = useState<PermissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [form, setForm] = useState({ name: "", permissionIds: [] as number[] });

  const fetchData = async () => {
    setLoading(true);
    const [r, p] = await Promise.all([getRoles(), getPermissions()]);
    setRoles(r);
    setPermissions(p);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", permissionIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (role: RoleType) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      permissionIds: role.permissions.map((p) => p.id),
    });
    setDialogOpen(true);
  };

  const togglePermission = (id: number) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((pid) => pid !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (editingRole) {
      result = await updateRole(editingRole.id, form);
    } else {
      result = await createRole(form);
    }
    if (result) {
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      const success = await deleteRole(id);
      if (success) fetchData();
    }
  };

  // Group permissions by group_name
  const grouped = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.group_name]) acc[perm.group_name] = [];
      acc[perm.group_name].push(perm);
      return acc;
    },
    {} as Record<string, PermissionType[]>
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Button onClick={openCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Role
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">#</TableHead>
              <TableHead className="px-4 py-2">Role Name</TableHead>
              <TableHead className="px-4 py-2">Permissions</TableHead>
              <TableHead className="px-4 py-2">Users</TableHead>
              <TableHead className="px-4 py-2">Created</TableHead>
              <TableHead className="px-4 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role, index) => (
                <TableRow key={role.id}>
                  <TableCell className="px-4 py-2">{index + 1}</TableCell>
                  <TableCell className="px-4 py-2 font-medium capitalize">
                    {role.name}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <Badge key={perm.id} variant="outline" className="text-xs">
                          {perm.label || perm.name}
                        </Badge>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          None
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="secondary">
                      {role._count?.users || 0} users
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(role.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(role)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(role.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. editor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="max-h-60 space-y-4 overflow-y-auto rounded-md border p-4">
                {Object.entries(grouped).map(([group, perms]) => (
                  <div key={group}>
                    <p className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                      {group}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={form.permissionIds.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label
                            htmlFor={`perm-${perm.id}`}
                            className="cursor-pointer text-sm"
                          >
                            {perm.label || perm.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {permissions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No permissions available.
                  </p>
                )}
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
              <Button type="submit">
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
