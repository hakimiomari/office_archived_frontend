"use client";

import { useEffect, useState } from "react";
import { useTenders, Tender } from "@/config/tender/tender";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconGavel,
  IconCheck,
  IconBan,
  IconAlertTriangle,
  IconStar,
  IconRefresh,
  IconExternalLink,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileTypeCsv,
} from "@tabler/icons-react";
import { TenderStatusChart } from "@/components/tenders/tender-status-chart";
import { TenderSectorChart } from "@/components/tenders/tender-sector-chart";
import { TenderMonthlyChart } from "@/components/tenders/tender-monthly-chart";
import { useTranslations } from "next-intl";
import { RouteGuard } from "@/components/route-guard";
import { PermissionGate } from "@/components/permission-gate";
import { nextRoute } from "@/lib/route";
import api from "@/lib/api/axios";
import toast from "react-hot-toast";

type Summary = {
  total: number;
  open: number;
  closed: number;
  closingSoon: number;
  highPriority: number;
};

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diffMs = new Date(date).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default function TenderReportsPage() {
  const {
    getReportSummary,
    getReportStatus,
    getReportSector,
    getReportMonthly,
    getClosingSoon,
    exportTenders,
  } = useTenders();
  const t = useTranslations("tenders");
  const tCommon = useTranslations("common");
  const { changeRoute } = nextRoute();

  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [closingSoon, setClosingSoon] = useState<Tender[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [sum, status, sector, monthly, closing] = await Promise.all([
      getReportSummary(),
      getReportStatus(),
      getReportSector(),
      getReportMonthly(),
      getClosingSoon(7),
    ]);
    setSummary(sum);
    setStatusData(status);
    setSectorData(sector);
    setMonthlyData(monthly);
    setClosingSoon(closing);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await api.post("tenders/scrape");
      toast.success(
        `Scrape complete: ${res.data.inserted} new, ${res.data.updated} updated`
      );
      await fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  return (
    <RouteGuard permission="tender.read">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{t("reportsTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("reportsDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders({}, "pdf")}
            >
              <IconFileTypePdf className="me-2 h-4 w-4 text-red-600" />
              {t("exportPdf")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders({}, "excel")}
            >
              <IconFileSpreadsheet className="me-2 h-4 w-4 text-green-600" />
              {t("exportExcel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTenders({}, "csv")}
            >
              <IconFileTypeCsv className="me-2 h-4 w-4 text-blue-600" />
              {t("exportCsv")}
            </Button>
            <PermissionGate permission="tender.create">
              <Button onClick={handleScrape} disabled={scraping}>
                {scraping ? (
                  <>
                    <div className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                    {t("scraping")}
                  </>
                ) : (
                  <>
                    <IconRefresh className="me-2 h-4 w-4" />
                    {t("scrapeNow")}
                  </>
                )}
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconGavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalTenders")}
                </p>
                <p className="text-2xl font-bold">{summary?.total ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <IconCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("openTenders")}
                </p>
                <p className="text-2xl font-bold">{summary?.open ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
                <IconBan className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("closedTenders")}
                </p>
                <p className="text-2xl font-bold">{summary?.closed ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("closingSoon")}
                </p>
                <p className="text-2xl font-bold">
                  {summary?.closingSoon ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <IconStar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("highPriority")}
                </p>
                <p className="text-2xl font-bold">
                  {summary?.highPriority ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TenderStatusChart data={statusData} />
              <TenderSectorChart data={sectorData} />
            </div>
            {monthlyData.length > 0 && <TenderMonthlyChart data={monthlyData} />}
          </>
        )}

        {/* Closing Soon Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              {t("closingSoonWidget")}
            </CardTitle>
            <CardDescription>{t("closingSoonDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {closingSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noClosingSoon")}
              </p>
            ) : (
              <div className="space-y-2">
                {closingSoon.map((tender) => {
                  const days = daysUntil(tender.closingDate);
                  return (
                    <div
                      key={tender.id}
                      className="flex items-center justify-between border-b py-3 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tender.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tender.sector}
                          </Badge>
                          {days !== null && (
                            <span
                              className={`text-xs ${
                                days <= 3
                                  ? "text-destructive font-semibold"
                                  : "text-orange-600"
                              }`}
                            >
                              {t("daysLeft", { days })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ms-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(tender.sourceUrl, "_blank")
                          }
                        >
                          <IconExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeRoute(`/tenders/${tender.id}`)}
                        >
                          {tCommon("view")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
