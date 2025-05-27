import api from "./axios";
import toast from "react-hot-toast";
import { useUser } from "@/contexts/UserContext";

const login = async (event: any, loginInfo: Object, router: any) => {
  event.preventDefault();
  const { setUser } = useUser();
  await api
    .post("auth/login", loginInfo)
    .then((response) => {
      if (response.status == 201) {
        localStorage.setItem("access_token", response.data.access_token);
        // setUser(response.data.user);
        router.push("/dashboard");
      }
    })
    .catch((error) => {
      console.log(error);
      toast.error("Invalid Credentials");
    });
};

const logout = async (event: any, router: any) => {
  event.preventDefault();
  await api
    .get("auth/logout")
    .then((response) => {
      if (response.status == 200) {
        router.push("/");
        localStorage.removeItem("access_token");
      }
    })
    .catch((err) => {
      console.log(err);
      toast.error("Logout Failed");
    });
};

export { login, logout };
