import axios from "axios";
import toast from "react-hot-toast";
const login = async (event: any, loginInfo: Object, setLoginInfo: Function) => {
  event.preventDefault();
  await axios
    .post("http://localhost:8001/auth/login", loginInfo, {
      withCredentials: true,
    })
    .then((response) => {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);
      window.location.href = "/dashboard";
    })
    .catch((error) => {
      toast.error("Invalid Credentials");
    });
};

export { login };
