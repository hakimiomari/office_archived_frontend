"use client";

import { useEffect, useState } from "react";
import { useContracts, ContractMeta } from "@/config/contract/contract";
import { useMineralTypes } from "@/config/mineral/mineral";
import { ContractType, MineralType } from "@/contexts/LicenseContext";
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

const CONTRACT_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
  "PENDING",
] as const;

const UNITS = ["Kilometre", "Metre", "Hectares"] as const;
type UnitValue = (typeof UNITS)[number];

const CURRENCIES = ["AFN", "USD"] as const;
type CurrencyValue = (typeof CURRENCIES)[number];
const currencyLabel = (c: string) => (c === "USD" ? "$" : c);

type ContractFormData = {
  companyName: string;
  mineralTypeId: string;
  status: (typeof CONTRACT_STATUSES)[number];
  registrationNumber: string;
  price: string;
  priceCurrency: CurrencyValue;
  royalty: string;
  jobـopportunities: string;
  social_service_price: string;
  social_service_currency: CurrencyValue;
  area: string;
  unit: UnitValue;
  mineAddress: string;
  issueDate: string;
  expiryDate: string;
};

const emptyForm: ContractFormData = {
  companyName: "",
  mineralTypeId: "",
  status: "ACTIVE",
  registrationNumber: "",
  price: "",
  priceCurrency: "AFN",
  royalty: "",
  jobـopportunities: "",
  social_service_price: "",
  social_service_currency: "AFN",
  area: "",
  unit: "Kilometre",
  mineAddress: "",
  issueDate: "",
  expiryDate: "",
};

const statusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "EXPIRED":
      return "destructive";
    case "TERMINATED":
      return "secondary";
    default:
      return "outline";
  }
};

export default function ContractsPage() {
  const { getContracts, createContract, updateContract, deleteContract } =
    useContracts();
  const { getMineralTypes } = useMineralTypes();
  const { can } = usePermission();

  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [meta, setMeta] = useState<ContractMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [minerals, setMinerals] = useState<MineralType[]>([]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContractType | null>(null);
  const [form, setForm] = useState<ContractFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (p = page, l = limit, s = search) => {
    setLoading(true);
    const { data, meta } = await getContracts(p, l, s);
    setContracts(data);
    setMeta(meta);
    setLoading(false);
  };

  useEffect(() => {
    load(page, limit, search);
    getMineralTypes(1, 500).then(({ data }) => setMinerals(data));
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

  const openEdit = (c: ContractType) => {
    setEditing(c);
    setForm({
      companyName: c.companyName,
      mineralTypeId: c.mieralTypeId,
      status: c.status as (typeof CONTRACT_STATUSES)[number],
      registrationNumber: c.registrationNumber ?? "",
      price: c.price ?? "",
      priceCurrency: (c.priceCurrency as CurrencyValue) ?? "AFN",
      royalty: c.royalty != null ? String(c.royalty) : "",
      jobـopportunities:
        c.jobـopportunities != null ? String(c.jobـopportunities) : "",
      social_service_price:
        c.social_service_price != null ? String(c.social_service_price) : "",
      social_service_currency:
        (c.social_service_currency as CurrencyValue) ?? "AFN",
      area: c.area != null ? String(c.area) : "",
      unit: (c.unit as UnitValue) ?? "Kilometre",
      mineAddress: c.mineAddress ?? "",
      issueDate: c.issueDate
        ? new Date(c.issueDate).toISOString().split("T")[0]
        : "",
      expiryDate: c.expiryDate
        ? new Date(c.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      companyName: form.companyName,
      mineralTypeId: form.mineralTypeId,
      status: form.status,
      price: form.price,
      priceCurrency: form.priceCurrency,
      mineAddress: form.mineAddress,
      issueDate: new Date(form.issueDate).toISOString(),
      expiryDate: new Date(form.expiryDate).toISOString(),
    };
    if (form.registrationNumber)
      payload.registrationNumber = form.registrationNumber;
    if (form.royalty !== "") payload.royalty = Number(form.royalty);
    if (form.jobـopportunities !== "")
      payload.jobـopportunities = Number(form.jobـopportunities);
    if (form.social_service_price !== "")
      payload.social_service_price = Number(form.social_service_price);
    if (form.social_service_currency)
      payload.social_service_currency = form.social_service_currency;
    if (form.area !== "") payload.area = Number(form.area);
    if (form.unit) payload.unit = form.unit;

    const result = editing
      ? await updateContract(editing.id, payload)
      : await createContract(payload);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      load(page, limit, search);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteContract(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (success) load(page, limit, search);
  };

  const columns: ColumnDef<ContractType>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) =>
        ((meta?.page || 1) - 1) * (meta?.limit || 10) + row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("companyName")}</span>
      ),
    },
    {
      id: "mineral",
      accessorFn: (c) => c.mineralType?.name ?? c.mieralTypeId,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mineral" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.mineralType?.name ?? "—"}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={statusColor(row.getValue("status"))}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) =>
        row.original.price
          ? `${row.original.price} ${currencyLabel(
              row.original.priceCurrency ?? "AFN",
            )}`
          : "—",
    },
    {
      accessorKey: "royalty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Royalty" />
      ),
      cell: ({ row }) => row.original.royalty ?? "—",
    },
    {
      accessorKey: "jobـopportunities",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Job Opportunities" />
      ),
      cell: ({ row }) => row.original.jobـopportunities ?? "—",
    },
    {
      accessorKey: "social_service_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Social Service" />
      ),
      cell: ({ row }) =>
        row.original.social_service_price != null
          ? `${row.original.social_service_price} ${currencyLabel(
              row.original.social_service_currency ?? "AFN",
            )}`
          : "—",
    },
    {
      id: "area",
      accessorFn: (c) =>
        c.area != null ? `${c.area} ${c.unit ?? ""}`.trim() : "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Area" />
      ),
      cell: ({ row }) =>
        row.original.area != null
          ? `${row.original.area} ${row.original.unit ?? ""}`.trim()
          : "—",
    },
    {
      accessorKey: "mineAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mine Address" />
      ),
    },
    {
      accessorKey: "registrationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Registration #" />
      ),
      cell: ({ row }) => row.original.registrationNumber ?? "—",
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Issue Date" />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("issueDate")).toLocaleDateString(),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expiry Date" />
      ),
      cell: ({ row }) =>
        new Date(row.getValue("expiryDate")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can("contract.update") && (
                <DropdownMenuItem onClick={() => openEdit(c)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {can("contract.delete") && (
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
        );
      },
    },
  ];

  const table = useReactTable({
    data: contracts,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <RouteGuard permission="contract.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Contracts</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="contract.create">
            <Button onClick={openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by company, registration # or mineral..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button variant="outline" onClick={handleSearch}>
              Search
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
                    No contracts found
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
              {editing ? "Edit Contract" : "New Contract"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, companyName: e.target.value }))
                }
                placeholder="Acme Trading Co."
                required
              />
            </div>

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
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      status: v as (typeof CONTRACT_STATUSES)[number],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="50000"
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
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      registrationNumber: e.target.value,
                    }))
                  }
                  placeholder="REG-2026-001 (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="jobـopportunities">Job Opportunities</Label>
                <Input
                  id="jobـopportunities"
                  type="number"
                  min="0"
                  step="1"
                  value={form.jobـopportunities}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      jobـopportunities: e.target.value,
                    }))
                  }
                  placeholder="(optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="social_service_price">
                  Social Service Price
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="social_service_price"
                    value={form.social_service_price}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        social_service_price: e.target.value,
                      }))
                    }
                    placeholder="(optional)"
                    className="flex-1"
                  />

                  <Select
                    value={form.social_service_currency}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        social_service_currency: v as CurrencyValue,
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
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  type="number"
                  min="0"
                  step="1"
                  value={form.area}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, area: e.target.value }))
                  }
                  placeholder="(optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, unit: v as UnitValue }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mineAddress">Mine Address</Label>
              <Input
                id="mineAddress"
                value={form.mineAddress}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mineAddress: e.target.value }))
                }
                placeholder="Kabul, District 1"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, issueDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
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
              <Button type="submit" disabled={saving || !form.mineralTypeId}>
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Contract"
                    : "Create Contract"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Contract"
        description="This will permanently delete this contract. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
