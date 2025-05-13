import axios from "axios";
const login = async (event: any, loginInfo: Object, setLoginInfo: Function) => {
  event.preventDefault();
  await axios
    .post("http://localhost:8001/auth/login", loginInfo, {
      withCredentials: true,
    })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
};

export { login };
