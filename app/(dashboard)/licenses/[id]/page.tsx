"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { LicenseType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconEdit, IconArrowLeft } from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getLicense } = useLicenses();
  const { changeRoute } = nextRoute();

  const [license, setLicense] = useState<LicenseType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getLicense(id);
      setLicense(data);
      setLoading(false);
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-20 rounded" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex items-center justify-center p-12">
        License not found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeRoute("/licenses")}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">License Details</h1>
        <PermissionGate permission="license.update">
          <Button
            variant="outline"
            onClick={() => changeRoute(`/licenses/${id}/edit`)}
          >
            <IconEdit className="me-2 h-4 w-4" />
            Edit
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-base">
              {license.company?.name ?? license.companyId}
            </span>
            <Badge variant={statusColor(license.status)}>
              {license.status}
            </Badge>
            <Badge variant="outline">{license.licenseType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">
                {license.company?.name ?? license.companyId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mineral Type</p>
              <p className="font-medium">
                {license.mineralType?.name ?? "—"}
                {license.mineralType
                  ? ` (${license.mineralType.mineralCategory})`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Type</p>
              <p className="font-medium">{license.licenseType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{license.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mine Address</p>
              <p className="font-medium">{license.mineAddress}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">
                {new Date(license.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="font-medium">
                {new Date(license.expiryDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(license.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
