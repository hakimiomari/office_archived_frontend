"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LicenseType,
  LicenseTypeValue,
  LicenseStatusValue,
} from "@/contexts/LicenseContext";
import { useCompanies, Company } from "@/config/company/company";
import { useMineralTypes } from "@/config/mineral/mineral";
import { MineralType } from "@/contexts/LicenseContext";

const LICENSE_TYPES: LicenseTypeValue[] = ["SMALL_SCALE", "LARGE_SCALE"];

const LICENSE_STATUSES: LicenseStatusValue[] = [
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
  "PENDING",
];

export type LicenseFormData = {
  companyId: string;
  mineralTypeId: string;
  licenseType: LicenseTypeValue;
  status: LicenseStatusValue;
  issueDate: string;
  expiryDate: string;
  mineAddress: string;
};

interface LicenseFormProps {
  initialData?: LicenseType;
  onSubmit: (data: LicenseFormData) => Promise<void>;
  loading?: boolean;
  title: string;
}

export function LicenseForm({
  initialData,
  onSubmit,
  loading,
  title,
}: LicenseFormProps) {
  const { getCompanies } = useCompanies();
  const { getMineralTypes } = useMineralTypes();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [minerals, setMinerals] = useState<MineralType[]>([]);

  const [form, setForm] = useState<LicenseFormData>({
    companyId: initialData?.companyId || "",
    mineralTypeId: initialData?.mieralTypeId || "",
    licenseType: initialData?.licenseType || "SMALL_SCALE",
    status: initialData?.status || "ACTIVE",
    issueDate: initialData
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : "",
    expiryDate: initialData
      ? new Date(initialData.expiryDate).toISOString().split("T")[0]
      : "",
    mineAddress: initialData?.mineAddress || "",
  });

  useEffect(() => {
    getCompanies(1, 500).then(({ data }) => setCompanies(data));
    getMineralTypes(1, 500).then(({ data }) => setMinerals(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof LicenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={form.companyId}
                onValueChange={(v) => handleChange("companyId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.licenseNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mineral Type</Label>
              <Select
                value={form.mineralTypeId}
                onValueChange={(v) => handleChange("mineralTypeId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mineral type" />
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>License Type</Label>
              <Select
                value={form.licenseType}
                onValueChange={(v) =>
                  handleChange("licenseType", v as LicenseTypeValue)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {lt}
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
                  handleChange("status", v as LicenseStatusValue)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_STATUSES.map((s) => (
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
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => handleChange("issueDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mineAddress">Mine Address</Label>
            <Input
              id="mineAddress"
              value={form.mineAddress}
              onChange={(e) => handleChange("mineAddress", e.target.value)}
              placeholder="Kabul, District 1"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !form.companyId || !form.mineralTypeId}
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update License"
                  : "Create License"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
