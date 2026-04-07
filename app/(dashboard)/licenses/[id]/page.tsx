"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useLicenses } from "@/config/license/license";
import { LicenseType, ContractType } from "@/contexts/LicenseContext";
import { nextRoute } from "@/lib/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconEdit,
  IconArrowLeft,
  IconUpload,
  IconTrash,
  IconFile,
} from "@tabler/icons-react";
import { PermissionGate } from "@/components/permission-gate";
import { Skeleton } from "@/components/ui/skeleton";

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getLicense, uploadContract, getContracts, deleteContract } =
    useLicenses();
  const { changeRoute } = nextRoute();
  const [license, setLicense] = useState<LicenseType | null>(null);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [licData, conData] = await Promise.all([
      getLicense(id),
      getContracts(id),
    ]);
    setLicense(licData);
    setContracts(conData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadContract(id, file);
    if (result) {
      const updated = await getContracts(id);
      setContracts(updated || []);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteContract = async (contractId: string) => {
    if (confirm("Delete this contract?")) {
      const success = await deleteContract(id, contractId);
      if (success) {
        setContracts((prev) => prev.filter((c) => c.id !== contractId));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-20 rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-36 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex items-center justify-center p-12">
        License not found
      </div>
    );
  }

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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeRoute("/licenses")}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">License Details</h1>
        <PermissionGate permission="license.update">
          <Button
            variant="outline"
            onClick={() => changeRoute(`/licenses/${id}/edit`)}
          >
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {license.licenseNumber}
            <Badge variant={statusColor(license.status)}>
              {license.status}
            </Badge>
            <Badge variant="outline">{license.licenseType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{license.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Province</p>
              <p className="font-medium">{license.province}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{license.district}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">
                {new Date(license.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="font-medium">
                {new Date(license.expiryDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">
                {new Date(license.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contracts</CardTitle>
            <PermissionGate permission="contract.upload">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Contract"}
                </Button>
              </div>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No contracts uploaded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2">#</TableHead>
                  <TableHead className="px-4 py-2">File Name</TableHead>
                  <TableHead className="px-4 py-2">Type</TableHead>
                  <TableHead className="px-4 py-2">Uploaded</TableHead>
                  <TableHead className="px-4 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract, index) => (
                  <TableRow key={contract.id}>
                    <TableCell className="px-4 py-2">{index + 1}</TableCell>
                    <TableCell className="px-4 py-2">
                      <a
                        href={contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <IconFile className="h-4 w-4" />
                        {contract.fileName}
                      </a>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {contract.fileType}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {new Date(contract.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDeleteContract(contract.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
