"use client";

import { Suspense } from "react";
import ArchiveTable from "./archive-table";
import LoadingTable from "./loading-table";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("nav");
  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{t("officeArchive")}</p>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <ArchiveTable />
      </Suspense>
    </div>
  );
}
