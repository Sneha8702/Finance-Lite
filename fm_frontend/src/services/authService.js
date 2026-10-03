import { loginUser, signupUser, logoutUser } from "./api";

export default {
  login: loginUser,
  signup: signupUser,
  logout: logoutUser,
  isAuthenticated: () => Boolean(localStorage.getItem("access")),
};
