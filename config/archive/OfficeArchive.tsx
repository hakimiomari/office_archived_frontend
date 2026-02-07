import { DataTable } from "@/app/(dashboard)/office-archive/data-table-components/data-table";
import { columns } from "@/app/(dashboard)/office-archive/data-table-components/columns";
import DashboardLayout from "@/app/(dashboard)/DashboardLayout";
import { Expense } from "@/app/(dashboard)/office-archive/data-table-components/schema";
import { useArchives } from "./archive";
import { useArchive } from "@/contexts/ArchiveContext";

export default function OfficeArchive() {
  // const { getArchives } = useArchives();
  const { archive } = useArchive();
  const archives: Expense[] = archive;
  return (
    <DashboardLayout>
      <div
        className="h-full flex-1 flex-col space-y-2 p-8 md:flex py-4 md:gap-6 md:py-6
"
      >
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Office Archive</p>
        </div>
        <DataTable data={archives} columns={columns} />
      </div>
    </DashboardLayout>
  );
}
