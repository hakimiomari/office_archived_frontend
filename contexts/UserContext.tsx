"use client";

import api from "../lib/axios";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      await api.get("user/profile").then((response) => {
        setUser(response.data.user);
      });
    };
    if (pathname !== "/") {
      fetchData();
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
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
