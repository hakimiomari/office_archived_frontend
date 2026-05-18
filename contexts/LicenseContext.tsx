"use client";

import { createContext, useContext, useState } from "react";

export type LicenseTypeValue = "SMALL_SCALE" | "LARGE_SCALE";

export type LicenseStatusValue =
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "PENDING";

export type ContractStatusValue =
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "PENDING";

export type MineralCategoryValue = "METALLIC" | "NONMETALLIC";

export type MineralType = {
  id: string;
  name: string;
  mineralCategory: MineralCategoryValue;
};

export type CompanyRef = {
  id: string;
  name: string;
  licenseNumber: string;
  TIN: string;
  address: string;
};

export type LicenseType = {
  id: string;
  companyId: string;
  mieralTypeId: string;
  licenseType: LicenseTypeValue;
  status: LicenseStatusValue;
  issueDate: string;
  expiryDate: string;
  mineAddress: string;
  createdBy: number | null;
  updatedBy: number | null;
  deletedBy: number | null;
  createdAt: string;
  updatedAt: string;
  company?: CompanyRef;
  mineralType?: MineralType;
};

export type ContractType = {
  id: string;
  companyName: string;
  status: ContractStatusValue;
  mieralTypeId: string;
  registrationNumber: string | null;
  price: string;
  mineAddress: string;
  issueDate: string;
  expiryDate: string;
  createdBy: number | null;
  updatedBy: number | null;
  deletedBy: number | null;
  createdAt: string;
  updatedAt: string;
  mineralType?: MineralType;
};

export type LicenseMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type LicenseAggregations = {
  totalLicenses: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
};

type LicenseContextType = {
  licenses: LicenseType[];
  setLicenses: React.Dispatch<React.SetStateAction<LicenseType[]>>;
  meta: LicenseMeta | null;
  setMeta: React.Dispatch<React.SetStateAction<LicenseMeta | null>>;
  aggregations: LicenseAggregations | null;
  setAggregations: React.Dispatch<
    React.SetStateAction<LicenseAggregations | null>
  >;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [licenses, setLicenses] = useState<LicenseType[]>([]);
  const [meta, setMeta] = useState<LicenseMeta | null>(null);
  const [aggregations, setAggregations] =
    useState<LicenseAggregations | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <LicenseContext.Provider
      value={{
        licenses,
        setLicenses,
        meta,
        setMeta,
        aggregations,
        setAggregations,
        loading,
        setLoading,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
};
