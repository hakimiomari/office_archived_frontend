"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { LicenseType, ContractType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  IconEdit,
  IconArrowLeft,
  IconTrash,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";
import { provinceKey } from "@/lib/constants/provinces";

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getLicense, getContracts, deleteContract } = useLicenses();
  const { changeRoute } = nextRoute();
  const t = useTranslations("licenses");
  const tCommon = useTranslations("common");
  const tProvinces = useTranslations("provinces");

  const translateProvince = (p: string) => {
    try {
      return tProvinces(provinceKey(p) as any);
    } catch {
      return p;
    }
  };
  const [license, setLicense] = useState<LicenseType | null>(null);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirm state
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [licData, conData] = await Promise.all([
      getLicense(id),
      getContracts(id),
    ]);
    setLicense(licData);
    setContracts(conData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteContract = async () => {
    if (!deleteContractId) return;
    setDeleting(true);
    const success = await deleteContract(deleteContractId);
    setDeleting(false);
    setDeleteContractId(null);
    if (success) {
      setContracts((prev) => prev.filter((c) => c.id !== deleteContractId));
    }
  };

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
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-36 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex items-center justify-center p-12">
        {t("licenseNotFound")}
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "EXPIRED":
        return "destructive";
      case "SUSPENDED":
        return "secondary";
      default:
        return "outline";
    }
  };

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
        <h1 className="text-2xl font-bold">{t("licenseDetails")}</h1>
        <PermissionGate permission="license.update">
          <Button
            variant="outline"
            onClick={() => changeRoute(`/licenses/${id}/edit`)}
          >
            <IconEdit className="me-2 h-4 w-4" />
            {tCommon("edit")}
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="font-mono text-base">{license.id}</span>
            <Badge variant={statusColor(license.status)}>
              {license.status}
            </Badge>
            <Badge variant="outline">{license.licenseType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("province")}</p>
              <p className="font-medium">{translateProvince(license.province)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("district")}</p>
              <p className="font-medium">{license.district}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("issueDate")}</p>
              <p className="font-medium">
                {new Date(license.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("expiryDate")}</p>
              <p className="font-medium">
                {new Date(license.expiryDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("createdAtLabel")}</p>
              <p className="font-medium">
                {new Date(license.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("contracts")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {t("noContracts")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">#</TableHead>
                  <TableHead className="px-4 py-2">{t("company")}</TableHead>
                  <TableHead className="px-4 py-2">{t("type")}</TableHead>
                  <TableHead className="px-4 py-2">{tCommon("status")}</TableHead>
                  <TableHead className="px-4 py-2">#</TableHead>
                  <TableHead className="px-4 py-2">{t("startDate")}</TableHead>
                  <TableHead className="px-4 py-2">{t("endDate")}</TableHead>
                  <TableHead className="px-4 py-2">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract, index) => (
                  <TableRow key={contract.id}>
                    <TableCell className="px-4 py-2">{index + 1}</TableCell>
                    <TableCell className="px-4 py-2 font-mono text-xs">
                      {contract.company?.licenseNumber ?? contract.companyId}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant="outline">{contract.contractType}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={statusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {contract.contractNumber ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {contract.startDate
                        ? new Date(contract.startDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {contract.endDate
                        ? new Date(contract.endDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <PermissionGate permission="contract.delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setDeleteContractId(contract.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteContractId}
        onOpenChange={(open) => !open && setDeleteContractId(null)}
        title={t("deleteContract")}
        description={t("deleteContractConfirm")}
        onConfirm={handleDeleteContract}
        loading={deleting}
      />
    </div>
  );
}
