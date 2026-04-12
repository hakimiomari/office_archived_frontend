"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTenders, Tender, TenderType, TenderSector, TenderStatus } from "@/config/tender/tender";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconArrowLeft,
  IconEdit,
  IconExternalLink,
  IconCalendar,
  IconMapPin,
  IconBriefcase,
  IconHash,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { RouteGuard } from "@/components/route-guard";

const statusVariant = (status: TenderStatus) => {
  switch (status) {
    case "OPEN":
      return "default";
    case "CLOSED":
      return "secondary";
    default:
      return "outline";
  }
};

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getTender, logActivity } = useTenders();
  const { changeRoute } = nextRoute();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("tenders");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getTender(id);
      setTender(data);
      setLoading(false);
      // Log view activity
      if (data) {
        logActivity(id, "VIEWED");
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex items-center justify-center p-12">
        {t("tenderNotFound")}
      </div>
    );
  }

  const typeLabel: Record<TenderType, string> = {
    TENDER: t("typeTender"),
    CONSULTING: t("typeConsulting"),
    AUCTION: t("typeAuction"),
    NOTICE: t("typeNotice"),
    ANNOUNCEMENT: t("typeAnnouncement"),
    OTHER: t("typeOther"),
  };

  const sectorLabel: Record<TenderSector, string> = {
    MINING: t("sectorMining"),
    OIL: t("sectorOil"),
    GAS: t("sectorGas"),
    CONSULTING: t("sectorConsulting"),
    OTHER: t("sectorOther"),
  };

  const activityLabel: Record<string, string> = {
    VIEWED: t("activityViewed"),
    APPLIED: t("activityApplied"),
    IGNORED: t("activityIgnored"),
    ASSIGNED: t("activityAssigned"),
    NOTIFIED: t("activityNotified"),
  };

  return (
    <RouteGuard permission="tender.read">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeRoute("/tenders")}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">{t("tenderDetails")}</h1>
          <Button
            variant="outline"
            onClick={() => window.open(tender.sourceUrl, "_blank")}
          >
            <IconExternalLink className="me-2 h-4 w-4" />
            {t("viewSource")}
          </Button>
          <PermissionGate permission="tender.update">
            <Button
              variant="outline"
              onClick={() => changeRoute(`/tenders?edit=${tender.id}`)}
            >
              <IconEdit className="me-2 h-4 w-4" />
              {tCommon("edit")}
            </Button>
          </PermissionGate>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{tender.title}</CardTitle>
            <CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant={statusVariant(tender.status)}>
                  {tender.status === "OPEN" ? t("open") : t("closed")}
                </Badge>
                <Badge variant="outline">{typeLabel[tender.type]}</Badge>
                <Badge variant="secondary">{sectorLabel[tender.sector]}</Badge>
                {tender.priorityScore !== null &&
                  tender.priorityScore !== undefined && (
                    <Badge variant="outline">
                      {t("priorityScore")}:{" "}
                      {tender.priorityScore.toFixed(2)}
                    </Badge>
                  )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tender.referenceNo && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconHash className="h-3 w-3" />
                    {t("referenceNo")}
                  </p>
                  <p className="font-medium">{tender.referenceNo}</p>
                </div>
              )}
              {tender.publishDate && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    {t("publishDate")}
                  </p>
                  <p className="font-medium">
                    {new Date(tender.publishDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {tender.closingDate && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    {t("closingDate")}
                  </p>
                  <p className="font-medium">
                    {new Date(tender.closingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {tender.projectName && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconBriefcase className="h-3 w-3" />
                    {t("projectName")}
                  </p>
                  <p className="font-medium">{tender.projectName}</p>
                </div>
              )}
              {tender.location && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconMapPin className="h-3 w-3" />
                    {t("location")}
                  </p>
                  <p className="font-medium">{tender.location}</p>
                </div>
              )}
              {tender.organization && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {tCommon("name")}
                  </p>
                  <p className="font-medium">{tender.organization.name}</p>
                </div>
              )}
            </div>

            {tender.description && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("description")}
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {tender.description}
                </p>
              </div>
            )}

            {tender.tags && tender.tags.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">{t("tags")}</p>
                <div className="flex flex-wrap gap-1">
                  {tender.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tenderActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!tender.activities || tender.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noActivity")}
              </p>
            ) : (
              <div className="space-y-2">
                {tender.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b py-2 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {activityLabel[activity.action]}
                      </Badge>
                      {activity.notes && (
                        <span className="text-sm text-muted-foreground">
                          {activity.notes}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
