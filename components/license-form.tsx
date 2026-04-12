"use client";

import { useState } from "react";
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
import { LicenseType } from "@/contexts/LicenseContext";
import { useTranslations } from "next-intl";
import { ProvinceSelect } from "@/components/province-select";

type LicenseFormData = {
  licenseNumber: string;
  companyName: string;
  licenseType: "SMALL" | "LARGE";
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  province: string;
  district: string;
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
  const t = useTranslations("licenses");
  const tCommon = useTranslations("common");
  const [form, setForm] = useState<LicenseFormData>({
    licenseNumber: initialData?.licenseNumber || "",
    companyName: initialData?.companyName || "",
    licenseType: initialData?.licenseType || "SMALL",
    issueDate: initialData
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : "",
    expiryDate: initialData
      ? new Date(initialData.expiryDate).toISOString().split("T")[0]
      : "",
    status: initialData?.status || "ACTIVE",
    province: initialData?.province || "",
    district: initialData?.district || "",
  });

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
              <Label htmlFor="licenseNumber">{t("licenseNumber")}</Label>
              <Input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) => handleChange("licenseNumber", e.target.value)}
                placeholder={t("licenseNumberPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("company")}</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder={t("companyNamePlaceholder")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("licenseType")}</Label>
              <Select
                value={form.licenseType}
                onValueChange={(v) =>
                  handleChange("licenseType", v as "SMALL" | "LARGE")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">{t("smallScale")}</SelectItem>
                  <SelectItem value="LARGE">{t("largeScale")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tCommon("status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="EXPIRED">{t("expired")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issueDate">{t("issueDate")}</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => handleChange("issueDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">{t("expiryDate")}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">{t("province")}</Label>
              <ProvinceSelect
                id="province"
                value={form.province}
                onValueChange={(v) => handleChange("province", v)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">{t("district")}</Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder={t("districtPlaceholder")}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading
                ? tCommon("saving")
                : initialData
                  ? t("updateLicense")
                  : t("createLicense")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
