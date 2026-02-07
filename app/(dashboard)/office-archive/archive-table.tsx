import { DataTable } from "./data-table-components/data-table";
import { columns } from "./data-table-components/columns";
import { getArchivesServer } from "@/lib/api/server-api";

export default async function ArchiveTable() {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

  const archives = await getArchivesServer();

  return <DataTable data={archives} columns={columns} />;
}
