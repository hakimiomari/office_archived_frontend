"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { LicenseForm } from "@/components/license-form";
import { LicenseType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";

export default function EditLicensePage() {
  const { id } = useParams<{ id: string }>();
  const { getLicense, updateLicense } = useLicenses();
  const { changeRoute } = nextRoute();
  const [license, setLicense] = useState<LicenseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
      <div className="flex items-center justify-center p-12">Loading...</div>
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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <LicenseForm
        title="Edit License"
        initialData={license}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
