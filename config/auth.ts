import { useState } from "react";
import api from "../lib/api/axios";
import toast from "react-hot-toast";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, fetchProfile } = useUser();
  const router = useRouter();

  // login
  const login = async (event: any, loginInfo: Object) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("auth/sign-in", loginInfo);
      if (response.status == 201) {
        await fetchProfile();
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Invalid Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (event: any) => {
    event.preventDefault();
    await api
      .post("auth/logout")
      .then((response) => {
        if (response.status == 201) {
          router.push("/");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Logout Failed");
      });
  };

  return { login, logout, isLoading };
};
