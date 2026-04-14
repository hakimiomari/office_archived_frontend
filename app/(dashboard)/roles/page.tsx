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
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useTranslations } from "next-intl";
import { useLocale } from "@/contexts/LocaleContext";

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
  const t = useTranslations("roles");
  const tCommon = useTranslations("common");
  const { dir } = useLocale();
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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
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
        <DataTableColumnHeader column={column} title={t("role")} />
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
      header: t("permissions"),
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
                +{role.permissions.length - 5} {t("more")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "users",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("usersCount")} />
      ),
      accessorFn: (row) => row._count?.users || 0,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <Badge variant="secondary">
            {role._count?.users || 0} {t("usersCount")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: tCommon("actions"),
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
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <RouteGuard permission="role.read">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <Badge variant="default" className="text-sm">
              {roles.length}
            </Badge>
          </div>
          <PermissionGate permission="role.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              {t("newRole")}
            </Button>
          </PermissionGate>
        </div>

        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">{t("rolesTab")}</TabsTrigger>
            <TabsTrigger value="matrix">{t("permissionMatrix")}</TabsTrigger>
          </TabsList>

          {/* ─── ROLES TAB ─── */}
          <TabsContent value="roles">
            <div className="mb-3 flex justify-end">
              <DataTableViewOptions table={table} />
            </div>
            <div className="mb-3 overflow-x-auto rounded-md border">
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
                        {t("noRoles")}
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

            {roles.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{tCommon("rowsPerPage")}:</span>
                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(v) =>
                      setPagination({ pageIndex: 0, pageSize: Number(v) })
                    }
                  >
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>
                    {tCommon("showing")}{" "}
                    {roles.length > 0
                      ? pagination.pageIndex * pagination.pageSize + 1
                      : 0}{" "}
                    {tCommon("to")}{" "}
                    {Math.min(
                      (pagination.pageIndex + 1) * pagination.pageSize,
                      roles.length,
                    )}{" "}
                    {tCommon("of")} {roles.length}
                  </span>
                </div>
                {table.getPageCount() > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      {tCommon("previous")}
                    </Button>
                    <span className="text-sm">
                      {tCommon("page")} {pagination.pageIndex + 1}{" "}
                      {tCommon("of")} {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                    >
                      {tCommon("next")}
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── PERMISSION MATRIX TAB ─── */}
          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>{t("permissionMatrix")}</CardTitle>
                <CardDescription>
                  {t("permissionMatrixDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="sticky bg-background px-4 py-2 font-bold"
                          style={
                            dir === "rtl"
                              ? { right: 0, left: "auto" }
                              : { left: 0, right: "auto" }
                          }
                        >
                          {t("moduleAction")}
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
                                  <TableCell
                                    className="sticky bg-background px-4 py-2 ps-8 text-sm"
                                    style={
                                      dir === "rtl"
                                        ? { right: 0, left: "auto" }
                                        : { left: 0, right: "auto" }
                                    }
                                  >
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
                {editingRole ? t("editRole") : t("createRole")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">{t("roleName")}</Label>
                <Input
                  id="roleName"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={t("roleNamePlaceholder")}
                  required
                />
              </div>

              {/* Permission Matrix in Dialog */}
              <div className="space-y-2">
                <Label>{t("permissions")}</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 py-2 font-bold">
                          {t("module")}
                        </TableHead>
                        <TableHead className="px-4 py-2 text-center">
                          {t("allPermissions")}
                        </TableHead>
                        {/* Dynamic action columns */}
                        {[
                          t("createPerm"),
                          t("readPerm"),
                          t("updatePerm"),
                          t("deletePerm"),
                          t("otherPermissions"),
                        ].map((a) => (
                          <TableHead
                            key={a}
                            className="px-3 py-2 text-center text-xs"
                          >
                            {a}
                          </TableHead>
                        ))}
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
                  {tCommon("cancel")}
                </Button>
                <Button type="submit">
                  {editingRole ? t("updateRole") : t("createRole")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={t("deleteRole")}
          description={t("deleteConfirm")}
          onConfirm={handleDelete}
          loading={deleting}
        />
      </div>
    </RouteGuard>
  );
}
