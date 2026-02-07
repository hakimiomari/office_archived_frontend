import { createContext, useContext, useState } from "react";

type ArchiveType = {
  id: string;
  memo: string;
  title: string;
  register_number: string;
  date_exported_or_received: string;
  note: string;
  file_number: number;
  archive_category: string;
  type: "income" | "expense";
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
};

type ArchiveContextType = {
  archive: ArchiveType[];
  setArchive: React.Dispatch<React.SetStateAction<ArchiveType[]>>;
};

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

export const ArchiveProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [archive, setArchive] = useState<ArchiveType[]>([]);

  return (
    <ArchiveContext.Provider value={{ archive, setArchive }}>
      {children}
    </ArchiveContext.Provider>
  );
};

export const useArchive = (): ArchiveContextType => {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error("useArchive must be used within a ArchiveProvider");
  }
  return context;
};
