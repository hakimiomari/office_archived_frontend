"use client";

import { use, useEffect, useState } from "react";
import { useSales, CustomerDetail } from "@/config/sales/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  IconArrowLeft,
  IconCash,
  IconReceipt,
  IconCoin,
  IconAlertTriangle,
  IconMail,
  IconPhone,
  IconMapPin,
  IconFileDownload,
} from "@tabler/icons-react";
import { RouteGuard } from "@/components/route-guard";
import { useTranslations } from "next-intl";
import { nextRoute } from "@/lib/route";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getCustomerById, downloadInvoicePdf, downloadCustomerReportPdf } =
    useSales();
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const { changeRoute } = nextRoute();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await getCustomerById(Number(id));
      setCustomer(result);
      setLoading(false);
    })();
  }, [id]);

  const fmt = (v: number) => v.toLocaleString();

  // Client-side filter for sale + payment history based on selected date range
  const filteredSales = customer?.sales.filter((s) => {
    const d = new Date(s.saleDate).getTime();
    if (fromDate && d < new Date(fromDate).getTime()) return false;
    if (toDate && d > new Date(toDate).getTime() + 86400000) return false;
    return true;
  }) ?? [];

  const filteredPayments = customer?.recentPayments.filter((p) => {
    const d = new Date(p.paymentDate).getTime();
    if (fromDate && d < new Date(fromDate).getTime()) return false;
    if (toDate && d > new Date(toDate).getTime() + 86400000) return false;
    return true;
  }) ?? [];

  const filteredTotals = filteredSales.reduce(
    (acc, s) => ({
      spent: acc.spent + s.totalAmount,
      paid: acc.paid + s.paidAmount,
      remaining: acc.remaining + s.remainingAmount,
    }),
    { spent: 0, paid: 0, remaining: 0 },
  );

  const hasDateFilter = !!(fromDate || toDate);

  const statusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PARTIAL":
        return "secondary";
      case "UNPAID":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">{t("noCustomers")}</p>
        <Button variant="outline" onClick={() => changeRoute("/sales/customers")}>
          <IconArrowLeft className="me-2 h-4 w-4" />
          {tCommon("back") || "Back"}
        </Button>
      </div>
    );
  }

  return (
    <RouteGuard permission="customer.read">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeRoute("/sales/customers")}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            {customer.totalOwed > 0 && (
              <Badge variant="destructive" className="text-sm">
                {t("totalOwed")}: {fmt(customer.totalOwed)}
              </Badge>
            )}
          </div>
          <Button
            onClick={() =>
              downloadCustomerReportPdf(
                customer.id,
                customer.name,
                fromDate || undefined,
                toDate || undefined,
              )
            }
          >
            <IconFileDownload className="me-2 h-4 w-4" />
            {t("downloadReport")}
          </Button>
        </div>

        {/* Profile card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("customer")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <IconPhone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("phone")}:</span>
              <span className="font-medium">{customer.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{tCommon("email")}:</span>
              <span className="font-medium">{customer.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("address")}:</span>
              <span className="font-medium">{customer.address || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("creditLimit")}:</span>
              <span className="font-medium">
                {fmt(customer.creditLimit)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Date range filter */}
        <div className="flex items-center gap-2 flex-wrap">
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
          {hasDateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              {tCommon("reset")}
            </Button>
          )}
        </div>

        {/* Financial summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <IconReceipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("salesCount")}
                </p>
                <p className="text-2xl font-bold">
                  {hasDateFilter
                    ? filteredSales.length
                    : customer.stats.salesCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <IconCoin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalSpent")}
                </p>
                <p className="text-2xl font-bold">
                  {fmt(
                    hasDateFilter
                      ? filteredTotals.spent
                      : customer.stats.totalSpent,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <IconCash className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalPaid")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {fmt(
                    hasDateFilter
                      ? filteredTotals.paid
                      : customer.stats.totalPaid,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <IconAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("remainingBalance")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {fmt(
                    hasDateFilter
                      ? filteredTotals.remaining
                      : customer.stats.totalRemaining,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sale history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("salesHistory")}</CardTitle>
            <CardDescription>
              {filteredSales.length} {t("salesCount").toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t("noSales")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoiceNo")}</TableHead>
                      <TableHead>{t("saleDate")}</TableHead>
                      <TableHead>{t("totalAmount")}</TableHead>
                      <TableHead>{t("paidAmount")}</TableHead>
                      <TableHead>{t("remainingAmount")}</TableHead>
                      <TableHead>{t("paymentStatus")}</TableHead>
                      <TableHead>{tCommon("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">
                          {s.invoiceNo}
                        </TableCell>
                        <TableCell>
                          {new Date(s.saleDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {fmt(s.totalAmount)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {fmt(s.paidAmount)}
                        </TableCell>
                        <TableCell
                          className={
                            s.remainingAmount > 0 ? "text-red-600" : ""
                          }
                        >
                          {fmt(s.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(s.paymentStatus)}>
                            {t(`paymentStatus_${s.paymentStatus}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("paymentHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t("noPayments")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("paymentDate")}</TableHead>
                    <TableHead>{t("invoiceNo")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("referenceNo")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.sale?.invoiceNo ?? "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {fmt(p.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.referenceNo || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
