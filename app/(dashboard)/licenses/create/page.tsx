"use client";

import { useState } from "react";
import { useLicenses } from "@/config/license/license";
import { LicenseForm } from "@/components/license-form";
import { RouteGuard } from "@/components/route-guard";
import { nextRoute } from "@/lib/route";
import { useTranslations } from "next-intl";

export default function CreateLicensePage() {
  const { createLicense } = useLicenses();
  const { changeRoute } = nextRoute();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("licenses");

  const handleSubmit = async (data: any) => {
    setLoading(true);
    const result = await createLicense(data);
    setLoading(false);
    if (result) {
      changeRoute("/licenses");
    }
  };

  return (
    <RouteGuard permission="license.create">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <LicenseForm
          title={t("createLicense")}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </RouteGuard>
  );
}
