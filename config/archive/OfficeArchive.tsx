"use client";
import { DataTable } from "@/app/office-archive/data-table-components/data-table";
import { columns } from "@/app/office-archive/data-table-components/columns";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { Expense } from "@/app/office-archive/data-table-components/schema";

export default function OfficeArchive() {
  const data: Expense[] = [
    {
      id: "1",
      label: "salary",
      note: "monthly salary",
      category: "income",
      type: "income",
      amount: 5000,
      date: "2024-06-25",
    },
    {
      id: "2",
      label: "groceries",
      note: "weekly grocery shopping",
      category: "food",
      type: "expense",
      amount: 150,
      date: "2024-06-24",
    },
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Office Archive</p>
        </div>
        <DataTable data={data} columns={columns} />
      </div>
    </DashboardLayout>
  );
}
