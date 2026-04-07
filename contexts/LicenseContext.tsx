"use client";

import { createContext, useContext, useState } from "react";

export type LicenseType = {
  id: string;
  licenseNumber: string;
  companyName: string;
  licenseType: "SMALL" | "LARGE";
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  province: string;
  district: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contracts?: ContractType[];
};

export type ContractType = {
  id: string;
  licenseId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
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
