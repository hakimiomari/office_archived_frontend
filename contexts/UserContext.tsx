"use client";

import api from "../lib/api/axios";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profile_picture?: string;
  roles?: { id: number; name: string; permissions?: { id: number; name: string }[] }[];
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  permissions: string[];
  roles: string[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      await api.get("user/profile").then((response) => {
        const userData = response.data.user;
        setUser(userData);

        // Extract permissions from all roles
        if (userData.roles) {
          const allPerms = userData.roles.flatMap(
            (r: any) => r.permissions?.map((p: any) => p.name) || []
          );
          setPermissions([...new Set(allPerms)] as string[]);
          setRoles(userData.roles.map((r: any) => r.name));
        }
      });
    };
    if (pathname !== "/") {
      fetchData();
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, permissions, roles }}>
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
