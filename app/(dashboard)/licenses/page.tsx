"use client";

import { useEffect, useState } from "react";
import { useLicenses } from "@/config/license/license";
import { useLicense, LicenseType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlus,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { usePermission } from "@/hooks/use-permission";
import { RouteGuard } from "@/components/route-guard";

export default function LicensesPage() {
  const { getLicenses, deleteLicense } = useLicenses();
  const { licenses, meta, loading } = useLicense();
  const { changeRoute } = nextRoute();
  const { can } = usePermission();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getLicenses(page, 10, search);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    getLicenses(1, 10, search);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this license?")) {
      const success = await deleteLicense(id);
      if (success) getLicenses(page, 10, search);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "EXPIRED":
        return "destructive";
      case "SUSPENDED":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <RouteGuard permission="license.read">
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mining Licenses</h1>
        <PermissionGate permission="license.create">
          <Button onClick={() => changeRoute("/licenses/create")}>
            <IconPlus className="mr-2 h-4 w-4" />
            New License
          </Button>
        </PermissionGate>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by license number, company, or province..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">#</TableHead>
              <TableHead className="px-4 py-2">License No.</TableHead>
              <TableHead className="px-4 py-2">Company</TableHead>
              <TableHead className="px-4 py-2">Type</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Province</TableHead>
              <TableHead className="px-4 py-2">Issue Date</TableHead>
              <TableHead className="px-4 py-2">Expiry Date</TableHead>
              <TableHead className="px-4 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No licenses found.
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((lic: LicenseType, index: number) => (
                <TableRow key={lic.id}>
                  <TableCell className="px-4 py-2">
                    {((meta?.page || 1) - 1) * (meta?.limit || 10) + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    {lic.licenseNumber}
                  </TableCell>
                  <TableCell className="px-4 py-2">{lic.companyName}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline">{lic.licenseType}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant={statusColor(lic.status)}>{lic.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">{lic.province}</TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(lic.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(lic.expiryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => changeRoute(`/licenses/${lic.id}`)}
                        >
                          <IconEye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {can("license.update") && (
                          <DropdownMenuItem
                            onClick={() =>
                              changeRoute(`/licenses/${lic.id}/edit`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {can("license.delete") && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(lic.id)}
                            className="text-red-600"
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <IconChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
