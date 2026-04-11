"use client";

import { useEffect, useState } from "react";
import { useRoles, RoleType, PermissionType } from "@/config/users/roles";
import { PermissionGate } from "@/components/permission-gate";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/app/(dashboard)/office-archive/data-table-components/data-table-column-header";
import { DataTableViewOptions } from "@/app/(dashboard)/office-archive/data-table-components/data-table-view-options";

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

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteRole(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) fetchData();
  };

  // Helper: get permission ID by module.action name
  const getPermId = (name: string) =>
    permissions.find((p) => p.name === name)?.id;

  const columns: ColumnDef<RoleType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div>
            <span className="font-medium capitalize">{role.name}</span>
            {(role as any).description && (
              <p className="text-xs text-muted-foreground">
                {(role as any).description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "permissions",
      header: "Permissions",
      enableSorting: false,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {role.permissions.slice(0, 5).map((perm) => (
              <Badge key={perm.id} variant="outline" className="text-xs">
                {perm.name}
              </Badge>
            ))}
            {role.permissions.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{role.permissions.length - 5} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "users",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Users" />
      ),
      accessorFn: (row) => row._count?.users || 0,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <Badge variant="secondary">
            {role._count?.users || 0} users
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const role = row.original;
        return (
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
                onClick={() => setDeleteId(role.id)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: roles,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
            <div className="mb-3 flex justify-end">
              <DataTableViewOptions table={table} />
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-4 py-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {table.getVisibleFlatColumns().map((col) => (
                          <TableCell key={col.id} className="px-4 py-3">
                            <Skeleton className="h-4 w-full max-w-[120px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={table.getVisibleFlatColumns().length}
                        className="h-24 text-center"
                      >
                        No roles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
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

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Role"
          description="This will permanently delete this role. Users assigned to this role will lose its permissions. This action cannot be undone."
          onConfirm={handleDelete}
          loading={deleting}
        />
      </div>
    </RouteGuard>
  );
}
