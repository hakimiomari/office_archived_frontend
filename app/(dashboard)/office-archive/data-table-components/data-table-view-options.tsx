"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

// Map common column ids to translation keys
const COLUMN_LABEL_MAP: Record<string, { ns: string; key: string }> = {
  // Licenses / Reports
  licenseNumber: { ns: "licenses", key: "licenseNumber" },
  companyName: { ns: "licenses", key: "company" },
  licenseType: { ns: "licenses", key: "type" },
  status: { ns: "common", key: "status" },
  province: { ns: "licenses", key: "province" },
  district: { ns: "licenses", key: "district" },
  issueDate: { ns: "licenses", key: "issueDate" },
  expiryDate: { ns: "licenses", key: "expiryDate" },
  // Users
  name: { ns: "users", key: "user" },
  email: { ns: "common", key: "email" },
  created_at: { ns: "users", key: "createdAt" },
  // Roles
  users: { ns: "roles", key: "usersCount" },
};

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const tCommon = useTranslations("common");
  const tLicenses = useTranslations("licenses");
  const tUsers = useTranslations("users");
  const tRoles = useTranslations("roles");

  const getLabel = (columnId: string): string => {
    const mapping = COLUMN_LABEL_MAP[columnId];
    if (!mapping) return columnId;
    switch (mapping.ns) {
      case "common":
        return tCommon(mapping.key as any);
      case "licenses":
        return tLicenses(mapping.key as any);
      case "users":
        return tUsers(mapping.key as any);
      case "roles":
        return tRoles(mapping.key as any);
      default:
        return columnId;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="me-2 h-4 w-4" />
          {tCommon("viewColumns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>{tCommon("toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getLabel(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
