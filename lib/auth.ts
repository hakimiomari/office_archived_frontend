import api from "./axios";
import toast from "react-hot-toast";

const login = async (event: any, loginInfo: Object, router: any) => {
  event.preventDefault();
  await api
    .post("auth/login", loginInfo)
    .then((response) => {
      if (response.status == 201) {
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
      }
    })
    .catch((err) => {
      console.log(err);
      toast.error("Logout Failed");
    });
};

export { login, logout };
