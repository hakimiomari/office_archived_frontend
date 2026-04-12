"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { LicenseForm } from "@/components/license-form";
import { LicenseType } from "@/contexts/LicenseContext";
import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { useTranslations } from "next-intl";

export default function EditLicensePage() {
  const { id } = useParams<{ id: string }>();
  const { getLicense, updateLicense } = useLicenses();
  const { changeRoute } = nextRoute();
  const [license, setLicense] = useState<LicenseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const t = useTranslations("licenses");

  useEffect(() => {
    const fetchLicense = async () => {
      const data = await getLicense(id);
      setLicense(data);
      setFetching(false);
    };
    fetchLicense();
  }, [id]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    const result = await updateLicense(id, data);
    setLoading(false);
    if (result) {
      changeRoute(`/licenses/${id}`);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary"
            style={{ animationDuration: "0.6s" }}
          />
        </div>
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

  return (
    <RouteGuard permission="license.update">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <LicenseForm
          title={t("editLicense")}
          initialData={license}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </RouteGuard>
  );
}
