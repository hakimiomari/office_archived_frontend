import LoadingTable from "./loading-table";

export default function Loading() {
  return (
    <div className="h-full flex-1 flex-col space-y-2 p-8 md:flex py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Office Archive</p>
      </div>
      <LoadingTable />
    </div>
  );
}
