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
          router.push("/login");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Logout Failed");
      });
  };

  // self-signup: creates a company + first admin + Basic subscription
  // and logs the user in (same cookies as /auth/sign-in).
  const [isRegistering, setIsRegistering] = useState(false);

  type RegisterPayload = {
    companyName: string;
    companySlug?: string;
    name: string;
    email: string;
    password: string;
  };

  const register = async (
    event: React.FormEvent | null,
    payload: RegisterPayload,
  ): Promise<boolean> => {
    event?.preventDefault();
    setIsRegistering(true);
    try {
      const response = await api.post("auth/register", payload);
      if (response.status === 200 || response.status === 201) {
        await fetchProfile();
        router.push("/dashboard");
        return true;
      }
      return false;
    } catch (error: any) {
      // NestJS validation pipe → `message` is an array of validator
      // strings ("password must be at least 6 characters", …).
      // Conflicts / forbidden errors → `message` is a string.
      // Network error → no `response` at all.
      const data = error?.response?.data;
      const msg = Array.isArray(data?.message)
        ? data.message.join("\n")
        : typeof data?.message === "string"
          ? data.message
          : data?.error ?? "Could not create your account. Please try again.";
      toast.error(msg);
      // Log the full server payload to the browser console so you can
      // see the exact status + body when something unexpected fails.
      // eslint-disable-next-line no-console
      console.error("Register failed:", error?.response?.status, data);
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // google login
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const googleAuth = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      const res = await api.post(
        "google-authentication/google-login",
        { token: response.credential },
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchProfile();
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Google sign in failed. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return {
    login,
    logout,
    register,
    googleAuth,
    isLoading,
    isRegistering,
    isGoogleLoading,
  };
};
