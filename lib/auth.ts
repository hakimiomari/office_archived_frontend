import api from "./axios";
import toast from "react-hot-toast";
const login = async (event: any, loginInfo: Object) => {
  event.preventDefault();
  await api
    .post("auth/login", loginInfo)
    .then((response) => {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      toast.error("Invalid Credentials");
    });
};

const logout = async (event: any) => {
  event.preventDefault();
  await api
    .get("auth/logout")
    .then((response) => {
      console.log(response);
      localStorage.removeItem("access_token");
      window.location.href = "/";
    })
    .catch((err) => {
      console.log(err);
      toast.error("Logout Failed");
    });
};

export { login, logout };
