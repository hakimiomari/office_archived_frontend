"use client";

import api from "../lib/api/axios";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type UserRoleName = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_USER";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profile_picture?: string;
  userRole?: UserRoleName;
  companyId?: number | null;
  company?: { id: number; name: string; slug: string | null } | null;
  roles?: { id: number; name: string; permissions?: { id: number; name: string }[] }[];
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  permissions: string[];
  roles: string[];
  loading: boolean;
  fetchProfile: () => Promise<User | null>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchProfile = async (): Promise<User | null> => {
    try {
      const response = await api.get("user/profile");
      const userData: User = response.data.user;
      setUser(userData);

      // Extract permissions from all roles
      if (userData.roles) {
        const allPerms = userData.roles.flatMap(
          (r: any) => r.permissions?.map((p: any) => p.name) || []
        );
        setPermissions([...new Set(allPerms)] as string[]);
        setRoles(userData.roles.map((r: any) => r.name));
      }
      return userData;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pathname !== "/") {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, permissions, roles, loading, fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
