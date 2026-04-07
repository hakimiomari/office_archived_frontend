"use client";

import { useEffect, useState } from "react";
import { useRoles, RoleType, PermissionType } from "@/config/users/roles";
import { PermissionGate } from "@/components/permission-gate";
import { RouteGuard } from "@/components/route-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

// Define the permission matrix structure: module → actions
const PERMISSION_MATRIX: Record<string, string[]> = {
  license: ["create", "read", "update", "delete"],
  contract: ["upload", "read", "delete"],
  report: ["view", "export"],
  user: ["create", "read", "update", "delete"],
  role: ["create", "read", "update", "delete"],
};

export default function RolesPage() {
  const { getRoles, createRole, updateRole, deleteRole, getPermissions } =
    useRoles();
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [permissions, setPermissions] = useState<PermissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as number[],
  });

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
    setForm({ name: "", description: "", permissionIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (role: RoleType) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: (role as any).description || "",
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

  // Toggle all permissions for a module
  const toggleModule = (moduleName: string) => {
    const modulePerms = permissions.filter((p) => p.group_name === moduleName);
    const moduleIds = modulePerms.map((p) => p.id);
    const allSelected = moduleIds.every((id) =>
      form.permissionIds.includes(id)
    );

    setForm((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter((id) => !moduleIds.includes(id))
        : [...new Set([...prev.permissionIds, ...moduleIds])],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (editingRole) {
      result = await updateRole(editingRole.id, {
        name: form.name,
        permissionIds: form.permissionIds,
      });
    } else {
      result = await createRole({
        name: form.name,
        permissionIds: form.permissionIds,
      });
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

  // Helper: get permission ID by module.action name
  const getPermId = (name: string) =>
    permissions.find((p) => p.name === name)?.id;

  return (
    <RouteGuard permission="role.read">
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Role & Permission Management</h1>
        <PermissionGate permission="role.create">
          <Button onClick={openCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            New Role
          </Button>
        </PermissionGate>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>

        {/* ─── ROLES TAB ─── */}
        <TabsContent value="roles">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">#</TableHead>
                  <TableHead className="px-4 py-2">Role</TableHead>
                  <TableHead className="px-4 py-2">Permissions</TableHead>
                  <TableHead className="px-4 py-2">Users</TableHead>
                  <TableHead className="px-4 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-18 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role, index) => (
                    <TableRow key={role.id}>
                      <TableCell className="px-4 py-2">{index + 1}</TableCell>
                      <TableCell className="px-4 py-2">
                        <div>
                          <span className="font-medium capitalize">
                            {role.name}
                          </span>
                          {(role as any).description && (
                            <p className="text-xs text-muted-foreground">
                              {(role as any).description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 5).map((perm) => (
                            <Badge
                              key={perm.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {perm.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{role.permissions.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="secondary">
                          {role._count?.users || 0} users
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission="role.update">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(role)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="role.delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleDelete(role.id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── PERMISSION MATRIX TAB ─── */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of which roles have which permissions across all
                modules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background px-4 py-2 font-bold">
                        Module / Action
                      </TableHead>
                      {roles.map((role) => (
                        <TableHead
                          key={role.id}
                          className="px-4 py-2 text-center capitalize"
                        >
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(PERMISSION_MATRIX).map(
                      ([module, actions]) => (
                        <>
                          {/* Module header row */}
                          <TableRow key={`header-${module}`}>
                            <TableCell
                              colSpan={roles.length + 1}
                              className="bg-muted/50 px-4 py-1.5 text-sm font-semibold capitalize"
                            >
                              {module}
                            </TableCell>
                          </TableRow>
                          {/* Action rows */}
                          {actions.map((action) => {
                            const permName = `${module}.${action}`;
                            return (
                              <TableRow key={permName}>
                                <TableCell className="sticky left-0 bg-background px-4 py-2 pl-8 text-sm">
                                  {action}
                                </TableCell>
                                {roles.map((role) => {
                                  const has = role.permissions.some(
                                    (p) => p.name === permName
                                  );
                                  return (
                                    <TableCell
                                      key={`${role.id}-${permName}`}
                                      className="px-4 py-2 text-center"
                                    >
                                      {has ? (
                                        <span className="inline-block h-4 w-4 rounded-full bg-green-500" />
                                      ) : (
                                        <span className="inline-block h-4 w-4 rounded-full bg-muted" />
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── CREATE / EDIT DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                placeholder="e.g. manager"
                required
              />
            </div>

            {/* Permission Matrix in Dialog */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-2 font-bold">
                        Module
                      </TableHead>
                      <TableHead className="px-4 py-2 text-center">
                        All
                      </TableHead>
                      {/* Dynamic action columns */}
                      {["Create", "Read", "Update", "Delete", "Other"].map(
                        (a) => (
                          <TableHead
                            key={a}
                            className="px-3 py-2 text-center text-xs"
                          >
                            {a}
                          </TableHead>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(PERMISSION_MATRIX).map(
                      ([module, actions]) => {
                        const modulePerms = permissions.filter(
                          (p) => p.group_name === module
                        );
                        const moduleIds = modulePerms.map((p) => p.id);
                        const allChecked = moduleIds.every((id) =>
                          form.permissionIds.includes(id)
                        );

                        // Map actions to standard column positions
                        const standardActions = [
                          "create",
                          "read",
                          "update",
                          "delete",
                        ];
                        const otherActions = actions.filter(
                          (a) => !standardActions.includes(a)
                        );

                        return (
                          <TableRow key={module}>
                            <TableCell className="px-4 py-2 font-medium capitalize">
                              {module}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-center">
                              <Checkbox
                                checked={allChecked && moduleIds.length > 0}
                                onCheckedChange={() => toggleModule(module)}
                              />
                            </TableCell>
                            {standardActions.map((action) => {
                              const permName = `${module}.${action}`;
                              const perm = permissions.find(
                                (p) => p.name === permName
                              );
                              if (!perm) {
                                return (
                                  <TableCell
                                    key={action}
                                    className="px-3 py-2 text-center"
                                  >
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell
                                  key={action}
                                  className="px-3 py-2 text-center"
                                >
                                  <Checkbox
                                    checked={form.permissionIds.includes(
                                      perm.id
                                    )}
                                    onCheckedChange={() =>
                                      togglePermission(perm.id)
                                    }
                                  />
                                </TableCell>
                              );
                            })}
                            {/* Other column: non-standard actions */}
                            <TableCell className="px-3 py-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {otherActions.map((action) => {
                                  const permName = `${module}.${action}`;
                                  const perm = permissions.find(
                                    (p) => p.name === permName
                                  );
                                  if (!perm) return null;
                                  return (
                                    <div
                                      key={action}
                                      className="flex items-center gap-1"
                                    >
                                      <Checkbox
                                        checked={form.permissionIds.includes(
                                          perm.id
                                        )}
                                        onCheckedChange={() =>
                                          togglePermission(perm.id)
                                        }
                                      />
                                      <span className="text-xs capitalize">
                                        {action}
                                      </span>
                                    </div>
                                  );
                                })}
                                {otherActions.length === 0 && (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
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
    </RouteGuard>
  );
}
