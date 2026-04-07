"use client";

import { useState } from "react";
import { useLicenses } from "@/config/license/license";
import { LicenseForm } from "@/components/license-form";
import { nextRoute } from "@/lib/route";

export default function CreateLicensePage() {
  const { createLicense } = useLicenses();
  const { changeRoute } = nextRoute();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    const result = await createLicense(data);
    setLoading(false);
    if (result) {
      changeRoute("/licenses");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <LicenseForm
        title="Create New License"
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
