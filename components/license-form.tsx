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
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) => handleChange("licenseNumber", e.target.value)}
                placeholder="LIC-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Mining Corp"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>License Type</Label>
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
                  <SelectItem value="SMALL">Small Scale</SelectItem>
                  <SelectItem value="LARGE">Large Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input
                id="province"
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                placeholder="Kabul"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder="District 1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
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
