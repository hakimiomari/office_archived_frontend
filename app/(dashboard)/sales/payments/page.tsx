"use client";

import { useEffect, useState } from "react";
import {
  useSales,
  Payment,
  PaymentMethod,
  Meta,
} from "@/config/sales/sales";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";

export default function PaymentsPage() {
  const { getPayments, deletePayment } = useSales();
  const { can } = usePermission();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">(
    "ALL",
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getPayments({
      page,
      limit,
      method: methodFilter !== "ALL" ? methodFilter : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    });
    setPayments(result.data);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [page, limit, methodFilter, fromDate, toDate]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const ok = await deletePayment(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (ok) fetch();
  };

  return (
    <RouteGuard permission="payment.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("payments")}</h1>
            {meta && (
              <Badge variant="default" className="text-sm">
                {meta.total}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("from")}
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">{t("to")}</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[150px]"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
            >
              {tCommon("reset")}
            </Button>
          )}
          <Select
            value={methodFilter}
            onValueChange={(v) => {
              setMethodFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{tCommon("all")}</SelectItem>
              {(
                ["CASH", "BANK", "MOBILE", "CREDIT", "OTHER"] as PaymentMethod[]
              ).map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`paymentMethod_${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("paymentDate")}</TableHead>
                <TableHead>{t("invoiceNo")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("paymentMethod")}</TableHead>
                <TableHead>{t("referenceNo")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t("noPayments")}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {((meta?.page || 1) - 1) * (meta?.limit || limit) + idx + 1}
                    </TableCell>
                    <TableCell>
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {p.sale?.invoiceNo ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.sale?.customer?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {p.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`paymentMethod_${p.method}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.referenceNo || "—"}
                    </TableCell>
                    <TableCell>
                      {can("payment.delete") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteId(p.id)}
                              className="text-red-600"
                            >
                              <IconTrash className="me-2 h-4 w-4" />
                              {tCommon("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                {payments.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}{" "}
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deletePayment")}
        description={t("deletePaymentConfirm")}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </RouteGuard>
  );
}
