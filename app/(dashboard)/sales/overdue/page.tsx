"use client";

import { useEffect, useState } from "react";
import { useSales, Sale, Customer } from "@/config/sales/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  IconAlertTriangle,
  IconCash,
  IconFileDownload,
} from "@tabler/icons-react";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";

export default function OverdueInvoicesPage() {
  const { getOverdueSales, getCustomers, createPayment, downloadInvoicePdf } =
    useSales();
  const { can } = usePermission();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");

  const [overdue, setOverdue] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerFilter, setCustomerFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const result = await getOverdueSales({
      customerId: customerFilter !== "ALL" ? Number(customerFilter) : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    });
    setOverdue(result);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const result = await getCustomers({ limit: 500 });
    setCustomers(result.data);
  };

  useEffect(() => {
    fetch();
  }, [customerFilter, fromDate, toDate]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openPayment = (sale: Sale) => {
    setPaymentSale(sale);
    setPaymentAmount(String(sale.remainingAmount));
  };

  const handlePayment = async () => {
    if (!paymentSale) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    const result = await createPayment({
      saleId: paymentSale.id,
      amount,
    });
    setSaving(false);
    if (result) {
      setPaymentSale(null);
      fetch();
    }
  };

  const fmt = (v: number) => v.toLocaleString();
  const daysOverdue = (due: string | null) => {
    if (!due) return 0;
    return Math.max(
      0,
      Math.floor(
        (new Date().getTime() - new Date(due).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  };

  const totalOverdueAmount = overdue.reduce(
    (sum, s) => sum + s.remainingAmount,
    0,
  );

  return (
    <RouteGuard permission="sale.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("overdue")}</h1>
            <Badge variant="destructive" className="text-sm">
              {overdue.length}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={customerFilter}
            onValueChange={(v) => setCustomerFilter(v)}
          >
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder={t("customer")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allCustomers")}</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("from")}
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">{t("to")}</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
          {(customerFilter !== "ALL" || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomerFilter("ALL");
                setFromDate("");
                setToDate("");
              }}
            >
              {tCommon("reset")}
            </Button>
          )}
        </div>

        {/* Summary banner */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <IconAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("totalOverdue")}
              </p>
              <div className="text-2xl font-bold text-red-600">
                {loading ? (
                  <Skeleton className="h-7 w-32" />
                ) : (
                  fmt(totalOverdueAmount)
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("invoiceNo")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("totalAmount")}</TableHead>
                <TableHead>{t("paidAmount")}</TableHead>
                <TableHead>{t("remainingAmount")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{t("daysOverdue")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : overdue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    {t("noOverdue")}
                  </TableCell>
                </TableRow>
              ) : (
                overdue.map((s, idx) => {
                  const days = daysOverdue(s.dueDate);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {s.invoiceNo}
                      </TableCell>
                      <TableCell>{s.customer?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.customer?.phone ?? "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fmt(s.totalAmount)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {fmt(s.paidAmount)}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        {fmt(s.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        {s.dueDate
                          ? new Date(s.dueDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{days}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              downloadInvoicePdf(s.id, s.invoiceNo)
                            }
                            title={t("downloadPdf")}
                          >
                            <IconFileDownload className="h-4 w-4 text-blue-600" />
                          </Button>
                          {can("payment.create") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openPayment(s)}
                              title={t("recordPayment")}
                            >
                              <IconCash className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Record payment dialog */}
      <Dialog
        open={!!paymentSale}
        onOpenChange={(open) => !open && setPaymentSale(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recordPayment")}</DialogTitle>
          </DialogHeader>
          {paymentSale && (
            <div className="grid gap-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("invoiceNo")}:
                  </span>
                  <span className="font-mono font-semibold">
                    {paymentSale.invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("customer")}:
                  </span>
                  <span>{paymentSale.customer?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("remainingAmount")}:
                  </span>
                  <span className="text-red-600 font-semibold">
                    {fmt(paymentSale.remainingAmount)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oamount">{t("amount")}</Label>
                <Input
                  id="oamount"
                  type="number"
                  min="0.01"
                  max={paymentSale.remainingAmount}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentSale(null)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  disabled={
                    saving ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0 ||
                    Number(paymentAmount) > paymentSale.remainingAmount
                  }
                  onClick={handlePayment}
                >
                  {saving ? tCommon("saving") : t("recordPayment")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RouteGuard>
  );
}
