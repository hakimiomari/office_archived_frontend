import { Metadata } from "next";
import fs from "fs";
import path from "path";
import { DataTable } from "./data-table-components/data-table";
import { columns } from "./data-table-components/columns";
import DashboardLayout from "../layouts/DashboardLayout";

export const metadata: Metadata = {
  title: "Expenses",
  description: "A Expense tracker build using Tanstack Table.",
};

async function getData() {
  const filePath = path.join(
    process.cwd(),
    "./app/weekly-report/data-table-components",
    "data.json"
  );
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

export default async function WeeklyReport() {
  const data = await getData();

  console.log(data);
  const data2 = [
    {
      // id: "1",
      label: "salary",
      note: "monthly salary",
      category: "income",
      type: "income",
      amount: 5000,
      date: "2024-06-25",
    },
    {
      // id: "2",
      label: "groceries",
      note: "weekly grocery shopping",
      category: "food",
      type: "expense",
      amount: 150,
      date: "2024-06-24",
    },
  ];
  console.log(data2);

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
