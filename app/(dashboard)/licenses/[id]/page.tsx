"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { useCompanies, Company } from "@/config/company/company";
import { LicenseType, ContractType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  IconPlus,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";
import { provinceKey } from "@/lib/constants/provinces";

const CONTRACT_TYPES = ["SMALL_SCALE", "LARGE_SCALE"] as const;
const CONTRACT_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
  "PENDING",
] as const;

type ContractFormData = {
  companyId: string;
  contractType: (typeof CONTRACT_TYPES)[number];
  status: (typeof CONTRACT_STATUSES)[number];
  contractNumber: string;
  startDate: string;
  endDate: string;
};

const emptyContractForm: ContractFormData = {
  companyId: "",
  contractType: "SMALL_SCALE",
  status: "ACTIVE",
  contractNumber: "",
  startDate: "",
  endDate: "",
};

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getLicense,
    getContracts,
    deleteContract,
    createContract,
    updateContract,
  } = useLicenses();
  const { getCompanies } = useCompanies();
  const { can } = usePermission();
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

  const [companies, setCompanies] = useState<Company[]>([]);

  // Delete confirm state
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Contract create/edit dialog state
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractType | null>(
    null,
  );
  const [contractForm, setContractForm] =
    useState<ContractFormData>(emptyContractForm);
  const [savingContract, setSavingContract] = useState(false);

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

  const fetchCompanies = async () => {
    const { data } = await getCompanies(1, 500);
    setCompanies(data);
  };

  const openCreateContract = () => {
    setEditingContract(null);
    setContractForm(emptyContractForm);
    if (companies.length === 0) fetchCompanies();
    setContractDialogOpen(true);
  };

  const openEditContract = (contract: ContractType) => {
    setEditingContract(contract);
    setContractForm({
      companyId: contract.companyId,
      contractType: contract.contractType as (typeof CONTRACT_TYPES)[number],
      status: contract.status as (typeof CONTRACT_STATUSES)[number],
      contractNumber: contract.contractNumber ?? "",
      startDate: contract.startDate
        ? new Date(contract.startDate).toISOString().split("T")[0]
        : "",
      endDate: contract.endDate
        ? new Date(contract.endDate).toISOString().split("T")[0]
        : "",
    });
    if (companies.length === 0) fetchCompanies();
    setContractDialogOpen(true);
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContract(true);
    const payload: any = {
      companyId: contractForm.companyId,
      licenseId: id,
      contractType: contractForm.contractType,
      status: contractForm.status,
    };
    if (contractForm.contractNumber)
      payload.contractNumber = contractForm.contractNumber;
    if (contractForm.startDate)
      payload.startDate = new Date(contractForm.startDate).toISOString();
    if (contractForm.endDate)
      payload.endDate = new Date(contractForm.endDate).toISOString();

    const result = editingContract
      ? await updateContract(editingContract.id, payload)
      : await createContract(payload);
    setSavingContract(false);
    if (result) {
      setContractDialogOpen(false);
      fetchData();
    }
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
            <PermissionGate permission="contract.create">
              <Button size="sm" onClick={openCreateContract}>
                <IconPlus className="me-2 h-4 w-4" />
                Add Contract
              </Button>
            </PermissionGate>
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
                      <div className="flex items-center gap-1">
                        {can("contract.update") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditContract(contract)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        )}
                        {can("contract.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => setDeleteContractId(contract.id)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? "Edit Contract" : "Add Contract"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContractSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={contractForm.companyId}
                onValueChange={(v) =>
                  setContractForm((p) => ({ ...p, companyId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.licenseNumber} — {c.TIN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select
                  value={contractForm.contractType}
                  onValueChange={(v) =>
                    setContractForm((p) => ({
                      ...p,
                      contractType: v as (typeof CONTRACT_TYPES)[number],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tCommon("status")}</Label>
                <Select
                  value={contractForm.status}
                  onValueChange={(v) =>
                    setContractForm((p) => ({
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

            <div className="space-y-2">
              <Label htmlFor="contractNumber">Contract Number</Label>
              <Input
                id="contractNumber"
                value={contractForm.contractNumber}
                onChange={(e) =>
                  setContractForm((p) => ({
                    ...p,
                    contractNumber: e.target.value,
                  }))
                }
                placeholder="CTR-2026-001 (optional)"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t("startDate")}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) =>
                    setContractForm((p) => ({
                      ...p,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) =>
                    setContractForm((p) => ({
                      ...p,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContractDialogOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={savingContract || !contractForm.companyId}
              >
                {savingContract
                  ? tCommon("saving")
                  : editingContract
                    ? "Update Contract"
                    : "Add Contract"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
