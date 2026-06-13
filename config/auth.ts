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

  type RegisterResult =
    | { ok: true }
    | { ok: false; status: number | null; message: string };

  const register = async (
    event: React.FormEvent | null,
    payload: RegisterPayload,
  ): Promise<RegisterResult> => {
    event?.preventDefault();
    setIsRegistering(true);
    try {
      const response = await api.post("auth/register", payload);
      if (response.status === 200 || response.status === 201) {
        await fetchProfile();
        router.push("/dashboard");
        return { ok: true };
      }
      return {
        ok: false,
        status: response.status,
        message: `Unexpected status ${response.status} from /auth/register`,
      };
    } catch (error: any) {
      // Pull every diagnostic we can out of the error and surface it
      // both as a toast AND in the form (caller decides what to render).
      const status: number | null = error?.response?.status ?? null;
      const data = error?.response?.data;

      let message: string;
      if (!error?.response) {
        // No HTTP response at all → network error / CORS / server down.
        message =
          "Couldn't reach the server. Is the backend running on " +
          `${api.defaults.baseURL ?? "http://localhost:8001/api/"}?`;
      } else if (Array.isArray(data?.message)) {
        // class-validator failures come back as an array.
        message = data.message.join(" · ");
      } else if (typeof data?.message === "string") {
        message = data.message;
      } else if (typeof data?.error === "string") {
        message = data.error;
      } else {
        message = `HTTP ${status}: ${
          typeof data === "string" ? data : JSON.stringify(data ?? {})
        }`;
      }

      toast.error(message);
      // eslint-disable-next-line no-console
      console.error("Register failed", { status, data, error });
      return { ok: false, status, message };
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
