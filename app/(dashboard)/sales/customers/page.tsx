"use client";

import { useEffect, useState } from "react";
import { useSales, Customer, Meta } from "@/config/sales/sales";
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
import { useTranslations } from "next-intl";
import { nextRoute } from "@/lib/route";
import { useUser } from "@/contexts/UserContext";
import { useTenantFilter } from "@/contexts/TenantFilterContext";
import { useCompanies, Company } from "@/api/hooks/use-companies";

type FormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: string;
  notes: string;
  /** SUPER_ADMIN only — empty for non-super-admin users. */
  companyId: string;
};

const emptyForm: FormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  creditLimit: "0",
  notes: "",
  companyId: "",
};

export default function CustomersPage() {
  const {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useSales();
  const { can } = usePermission();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const { changeRoute } = nextRoute();

  // SUPER_ADMIN-only company picker. When acting as super-admin, the form
  // shows a Company Select; the chosen company is sent in the payload so
  // the backend creates the customer under that tenant. Non-super-admin
  // users never see the picker — their tenant comes from the JWT.
  const { user } = useUser();
  const isSuperAdmin = user?.userRole === "SUPER_ADMIN";
  const { filterCompanyId } = useTenantFilter();
  const { list: listCompanies } = useCompanies();
  const [companies, setCompanies] = useState<Company[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getCustomers({
      page,
      limit,
      search: search || undefined,
    });
    setCustomers(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [page, limit]);

  // Load companies once when the page mounts AS super-admin. Cheap (single
  // call), and a SUPER_ADMIN listing customers always needs this dropdown
  // for the create dialog.
  useEffect(() => {
    if (!isSuperAdmin) return;
    listCompanies({ page: 1, limit: 1000 }).then((res) =>
      setCompanies(res.data),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const openCreate = () => {
    setEditing(null);
    // For a SUPER_ADMIN already scoped via the CompanySwitcher, preselect
    // that company in the form so the typical "scope then create" flow
    // doesn't require an extra click.
    setForm({
      ...emptyForm,
      companyId:
        isSuperAdmin && filterCompanyId != null ? String(filterCompanyId) : "",
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      creditLimit: String(c.creditLimit),
      notes: c.notes ?? "",
      // companyId is immutable post-create; field is unused in edit but
      // must satisfy the FormData shape.
      companyId: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      creditLimit: Number(form.creditLimit) || 0,
      notes: form.notes || undefined,
    };
    // SUPER_ADMIN target company — backend ignores this for any other role.
    if (!editing && isSuperAdmin && form.companyId) {
      payload.companyId = Number(form.companyId);
    }
    const result = editing
      ? await updateCustomer(editing.id, payload as any)
      : await createCustomer(payload as any);
    setSaving(false);
    if (result) {
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deleteCustomer(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  return (
    <RouteGuard permission="customer.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("customers")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
          <PermissionGate permission="customer.create">
            <Button onClick={openCreate}>
              <IconPlus className="me-2 h-4 w-4" />
              {t("newCustomer")}
            </Button>
          </PermissionGate>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetch()}
            className="max-w-md"
          />
          <Button variant="outline" onClick={fetch}>
            {tCommon("search")}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{tCommon("email")}</TableHead>
                <TableHead>{t("creditLimit")}</TableHead>
                <TableHead>{t("totalOwed")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t("noCustomers")}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => changeRoute(`/sales/customers/${c.id}`)}
                      >
                        {c.name}
                      </button>
                    </TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.email || "—"}
                    </TableCell>
                    <TableCell>{c.creditLimit.toLocaleString()}</TableCell>
                    <TableCell
                      className={c.totalOwed > 0 ? "text-red-600 font-semibold" : ""}
                    >
                      {c.totalOwed.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {can("customer.update") && (
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <IconEdit className="me-2 h-4 w-4" />
                              {tCommon("edit")}
                            </DropdownMenuItem>
                          )}
                          {can("customer.delete") && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(c.id)}
                              className="text-red-600"
                            >
                              <IconTrash className="me-2 h-4 w-4" />
                              {tCommon("delete")}
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

        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{tCommon("rowsPerPage")}:</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
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
                {customers.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
                {tCommon("to")}{" "}
                {Math.min(meta.page * meta.limit, meta.total)} {tCommon("of")}{" "}
                {meta.total}
              </span>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(page + 1)}
                >
                  {tCommon("next")}
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editCustomer") : t("newCustomer")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* SUPER_ADMIN: choose the tenant this customer belongs to.
                Only shown on create — companyId is immutable after that. */}
            {isSuperAdmin && !editing && (
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={form.companyId}
                  onValueChange={(v) => setForm({ ...form, companyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cname">{tCommon("name")}</Label>
              <Input
                id="cname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cphone">{t("phone")}</Label>
                <Input
                  id="cphone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">{tCommon("email")}</Label>
                <Input
                  id="cemail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="caddr">{t("address")}</Label>
              <Input
                id="caddr"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccredit">{t("creditLimit")}</Label>
              <Input
                id="ccredit"
                type="number"
                min="0"
                step="0.01"
                value={form.creditLimit}
                onChange={(e) =>
                  setForm({ ...form, creditLimit: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnotes">{tCommon("notes") || "Notes"}</Label>
              <textarea
                id="cnotes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="border-input bg-background flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  (!editing && isSuperAdmin && !form.companyId)
                }
              >
                {saving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteCustomer")}
        description={t("deleteCustomerConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
