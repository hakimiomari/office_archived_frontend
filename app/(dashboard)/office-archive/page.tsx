import { Metadata } from "next";
import { Suspense } from "react";
import ArchiveTable from "./archive-table";
import LoadingTable from "./loading-table";

export const metadata: Metadata = {
  title: "Office Archive",
  description: "A Expense tracker build using Tanstack Table.",
};

export default function Page() {
  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Office Archive</p>
      </div>
      <Suspense fallback={<LoadingTable />}>
        <ArchiveTable />
      </Suspense>
    </div>
  );
}
