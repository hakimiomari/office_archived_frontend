"use client";

import { useEffect, useState } from "react";
import { useUsers, UserType, UserMeta } from "@/config/users/users";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserForm } from "@/components/user-form";
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
} from "@tabler/icons-react";
import { settings } from "@/config/settings";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useTranslations } from "next-intl";

export default function UsersPage() {
  const { getUsers, deleteUser } = useUsers();
  const { can } = usePermission();
  const { getNameInitials } = settings();
  const t = useTranslations("users");
  const tCommon = useTranslations("common");

  const [users, setUsers] = useState<UserType[]>([]);
  const [meta, setMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Modal state — actual form lives in <UserForm /> (see components/user-form.tsx)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async (p = page, l = limit, s = search) => {
    setLoading(true);
    const result = await getUsers(p, l, s);
    // Only replace the table data when the request actually returned an
    // array. This protects the existing rows from being wiped by a transient
    // error (e.g. brief 401 right after a write while cookies refresh).
    if (Array.isArray(result?.data)) {
      setUsers(result.data);
      setMeta(result.meta ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  // Auto-search as the user types, 300ms after they stop. Reset to page 1
  // on every new query so they see the first page of matches rather than
  // a maybe-empty deep page from the previous search.
  useEffect(() => {
    setPage(1);
    fetchUsers(1, limit, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, limit, search);
  };

  const openCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const openEdit = (user: UserType) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteUser(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) fetchUsers();
  };

  const columns: ColumnDef<UserType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("user")} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.name ?? "(no name)";
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.profile_picture || undefined}
                alt={displayName}
              />
              <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tCommon("email")} />
      ),
    },
    {
      id: "roles",
      header: t("roles"),
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
            {user.roles.length === 0 && (
              <span className="text-sm text-muted-foreground">
                {t("noRole")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("createdAt")} />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: tCommon("actions"),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can("user.update") && (
                <DropdownMenuItem onClick={() => openEdit(user)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
              )}
              {can("user.delete") && (
                <DropdownMenuItem
                  onClick={() => setDeleteId(user.id)}
                  className="text-red-600"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <RouteGuard permission="user.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="user.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              {t("newUser")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button variant="outline" onClick={handleSearch}>
              {tCommon("search")}
            </Button>
          </div>
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
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
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
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
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
                {tCommon("showing")}{" "}
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")} {Math.min(meta.page * meta.limit, meta.total)}{" "}
                {tCommon("of")} {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  | {tCommon("rowsPerPage")}:
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
                {tCommon("previous")}
              </Button>
              <span className="text-sm">
                {tCommon("page")} {meta.page} {tCommon("of")} {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon("next")}
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t("editUser") : t("createUser")}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            editingUser={editingUser}
            onSuccess={() => {
              // Close the dialog first, then refetch on the next tick so the
              // close animation can run unblocked. Refetching before the
              // dialog has closed has been observed to occasionally race with
              // React's re-render and leave the table looking empty.
              setDialogOpen(false);
              setEditingUser(null);
              setTimeout(() => fetchUsers(), 0);
            }}
            onCancel={() => {
              setDialogOpen(false);
              setEditingUser(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteUser")}
        description={t("deleteConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
