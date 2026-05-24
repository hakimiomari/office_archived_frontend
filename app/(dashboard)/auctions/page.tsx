"use client";

import { useEffect, useState } from "react";
import { useAuctions, AuctionMeta } from "@/config/auction/auction";
import { useMineralTypes } from "@/config/mineral/mineral";
import { AuctionType, MineralType } from "@/contexts/LicenseContext";
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
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
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
import { DataTableColumnHeader } from "@/app/(dashboard)/office-archive/data-table-components/data-table-column-header";
import { DataTableViewOptions } from "@/app/(dashboard)/office-archive/data-table-components/data-table-view-options";

const MASS_UNITS = ["Gram", "Kilogram", "Carat"] as const;
type MassUnitValue = (typeof MASS_UNITS)[number];

const CURRENCIES = ["AFN", "USD"] as const;
type CurrencyValue = (typeof CURRENCIES)[number];
const currencyLabel = (c: string) => (c === "USD" ? "$" : c);

type AuctionFormData = {
  mineralTypeId: string;
  round: string;
  mass: string;
  unit: MassUnitValue;
  unitPrice: string;
  priceCurrency: CurrencyValue;
  royalty: string;
};

const emptyForm: AuctionFormData = {
  mineralTypeId: "",
  round: "",
  mass: "",
  unit: "Gram",
  unitPrice: "",
  priceCurrency: "AFN",
  royalty: "",
};

export default function AuctionsPage() {
  const { getAuctions, createAuction, updateAuction, deleteAuction } =
    useAuctions();
  const { getMineralTypes } = useMineralTypes();
  const { can } = usePermission();

  const [auctions, setAuctions] = useState<AuctionType[]>([]);
  const [meta, setMeta] = useState<AuctionMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mineralFilter, setMineralFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [minerals, setMinerals] = useState<MineralType[]>([]);
  const ALL_MINERALS = "__all__";

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AuctionType | null>(null);
  const [form, setForm] = useState<AuctionFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (
    p = page,
    l = limit,
    s = search,
    m = mineralFilter,
  ) => {
    setLoading(true);
    const { data, meta } = await getAuctions(p, l, s, m || undefined);
    setAuctions(data);
    setMeta(meta);
    setLoading(false);
  };

  useEffect(() => {
    load(page, limit, search, mineralFilter);
    getMineralTypes(1, 500).then(({ data }) => setMinerals(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, mineralFilter]);

  const handleSearch = () => {
    setPage(1);
    load(1, limit, search, mineralFilter);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: AuctionType) => {
    setEditing(a);
    setForm({
      mineralTypeId: a.mieralTypeId,
      round: a.round ?? "",
      mass: a.mass ?? "",
      unit: (a.unit as MassUnitValue) ?? "Gram",
      unitPrice: a.unitPrice ?? "",
      priceCurrency: (a.priceCurrency as CurrencyValue) ?? "AFN",
      royalty: a.royalty != null ? String(a.royalty) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      mineralTypeId: form.mineralTypeId,
      mass: form.mass,
      unit: form.unit,
      unitPrice: form.unitPrice,
      priceCurrency: form.priceCurrency,
    };
    if (form.round) payload.round = form.round;
    if (form.royalty !== "") payload.royalty = Number(form.royalty);

    const result = editing
      ? await updateAuction(editing.id, payload)
      : await createAuction(payload);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      load(page, limit, search);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteAuction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) load(page, limit, search);
  };

  const totalPrice = (mass: number, price: number) => {
    return mass * price;
  };

  const columns: ColumnDef<AuctionType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "mineral",
      accessorFn: (a) => a.mineralType?.name ?? a.mieralTypeId,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mineral" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.mineralType?.name ?? "—"}</Badge>
      ),
    },
    {
      accessorKey: "round",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Round" />
      ),
      cell: ({ row }) => row.original.round ?? "—",
    },
    {
      id: "mass",
      accessorFn: (a) => `${a.mass} ${a.unit}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mass" />
      ),
      cell: ({ row }) => `${row.original.mass} ${row.original.unit}`.trim(),
    },
    {
      id: "unitPrice",
      accessorFn: (a) => `${a.unitPrice} ${currencyLabel(a.priceCurrency)}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit Price" />
      ),
      cell: ({ row }) =>
        `${row.original.unitPrice} ${currencyLabel(
          row.original.priceCurrency,
        )}`,
    },
    {
      id: "totalPrice",
      accessorFn: (a) =>
        `${totalPrice(Number(a.mass), Number(a.unitPrice))} ${currencyLabel(a.priceCurrency)}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Price" />
      ),
      cell: ({ row }) =>
        `${totalPrice(Number(row.original.mass), Number(row.original.unitPrice))} ${currencyLabel(
          row.original.priceCurrency,
        )}`,
    },
    {
      accessorKey: "royalty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Royalty" />
      ),
      cell: ({ row }) =>
        row.original.royalty != null ? `${row.original.royalty}%` : "—",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const a = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can("auction.update") && (
                <DropdownMenuItem onClick={() => openEdit(a)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {can("auction.delete") && (
                <DropdownMenuItem
                  onClick={() => setDeleteId(a.id)}
                  className="text-red-600"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: auctions,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <RouteGuard permission="auction.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Auctions</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="auction.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Auction
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-nowrap items-center gap-2">
            <Input
              placeholder="Search by round or mineral..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-72"
            />
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
            <Select
              value={mineralFilter || ALL_MINERALS}
              onValueChange={(v) => {
                setMineralFilter(v === ALL_MINERALS ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All minerals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MINERALS}>All minerals</SelectItem>
                {minerals.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mineralFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMineralFilter("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
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
                Array.from({ length: 8 }).map((_, i) => (
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
                    No auctions found
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
                Showing {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                to {Math.min(meta.page * meta.limit, meta.total)} of{" "}
                {meta.total}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Auction" : "New Auction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mineral Type</Label>
                <Select
                  value={form.mineralTypeId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, mineralTypeId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mineral" />
                  </SelectTrigger>
                  <SelectContent>
                    {minerals.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.mineralCategory})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="round">Round</Label>
                <Input
                  id="round"
                  value={form.round}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, round: e.target.value }))
                  }
                  placeholder="Round 1 (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mass">Mass</Label>
              <div className="flex gap-2">
                <Input
                  id="mass"
                  value={form.mass}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, mass: e.target.value }))
                  }
                  placeholder="100"
                  required
                  className="flex-1"
                />
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, unit: v as MassUnitValue }))
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MASS_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <div className="flex gap-2">
                  <Input
                    id="unitPrice"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, unitPrice: e.target.value }))
                    }
                    placeholder="500"
                    required
                    className="flex-1"
                  />
                  <Select
                    value={form.priceCurrency}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        priceCurrency: v as CurrencyValue,
                      }))
                    }
                  >
                    <SelectTrigger className="w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {currencyLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div className="space-y-2">
                
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Total Price</Label>
                <Input
                  id="unitPrice"
                  value={totalPrice(Number(form.mass), Number(form.unitPrice))}
                  disabled
                  placeholder="500"
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="royalty">Royalty (0–100)</Label>
              <Input
                id="royalty"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.royalty}
                onChange={(e) =>
                  setForm((p) => ({ ...p, royalty: e.target.value }))
                }
                placeholder="(optional)"
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
              <Button type="submit" disabled={saving || !form.mineralTypeId}>
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Auction"
                    : "Create Auction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Auction"
        description="This will permanently delete this auction. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
