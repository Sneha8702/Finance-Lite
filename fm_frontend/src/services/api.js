import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000",
});

const publicPaths = ["/api/token/", "/signup/", "/api/token/refresh/", "/resend-verification/", "/verify-email/", "/forgot-password/", "/reset-password/"];

const clearSession = () => {
  for (const key of ["access", "refresh", "username", "isLoggedIn"]) {
    localStorage.removeItem(key);
  }
};

let refreshPromise = null;
// Incrementing this prevents an in-flight refresh from restoring a logged-out session.
let sessionVersion = 0;

API.interceptors.request.use((config) => {
  const isPublic = publicPaths.includes(config.url);
  const token = localStorage.getItem("access");
  if (!isPublic && token) config.headers.Authorization = `Bearer ${token}`;
  config._sessionVersion = sessionVersion;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (!request || publicPaths.includes(request.url)) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || request._retry) return Promise.reject(error);
    if (request._sessionVersion !== sessionVersion) return Promise.reject(error);
    request._retry = true;
    const version = sessionVersion;
    try {
      const latestAccess = localStorage.getItem("access");
      if (latestAccess && request.headers.Authorization !== `Bearer ${latestAccess}`) {
        return API(request);
      }
      if (!refreshPromise) {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No refresh token");
        refreshPromise = axios.post("/api/token/refresh/", { refresh }, { baseURL: API.defaults.baseURL })
          .then(({ data }) => {
            if (version !== sessionVersion) throw new Error("Session changed");
            localStorage.setItem("access", data.access);
            if (data.refresh) localStorage.setItem("refresh", data.refresh);
            return data.access;
          })
          .finally(() => { refreshPromise = null; });
      }
      const access = await refreshPromise;
      if (version !== sessionVersion) throw new Error("Session changed");
      request.headers.Authorization = `Bearer ${access}`;
      return API(request);
    } catch (refreshError) {
      if (version === sessionVersion) {
        // A temporary network/server failure should not destroy a valid session.
        if (!localStorage.getItem("refresh") || [400, 401, 403].includes(refreshError.response?.status)) {
          sessionVersion += 1;
          clearSession();
          window.location.href = "/";
        }
      }
      return Promise.reject(refreshError);
    }
  }
);

// ---------------- LOGIN ----------------
export const loginUser = async (data) => {
  const response = await API.post("/api/token/", data);

  // ✅ Save tokens
  sessionVersion += 1;
  localStorage.setItem("access", response.data.access);
  localStorage.setItem("refresh", response.data.refresh);

  return response.data;
};
// ---------------- SIGNUP ----------------
export const signupUser = async (data) => {
  const response = await API.post("/signup/", data);

  if (response.data?.tokens) {
    sessionVersion += 1;
    localStorage.setItem("access", response.data.tokens.access);
    localStorage.setItem("refresh", response.data.tokens.refresh);
  }

  return response.data;
};

// ---------------- LOGOUT ----------------
export const logoutUser = async () => {
  // Wait for refresh rotation before revoking its newest token.
  try { if (refreshPromise) await refreshPromise; } catch { /* Clear session below. */ }
  const refresh = localStorage.getItem("refresh");
  const access = localStorage.getItem("access");
  sessionVersion += 1;
  clearSession();
  try {
    if (refresh && access) await axios.post("/logout/", { refresh }, {
      baseURL: API.defaults.baseURL,
      headers: { Authorization: `Bearer ${access}` },
    });
  } catch (error) {
    console.error("Server logout failed", error);
  }
};

// ---------------- ADD EXPENSE ----------------
export const addExpense = async (data) => {
  const response = await API.post("/add-expense/", data);
  return response.data;
};

// ---------------- ADD INCOME ----------------
export const addIncome = async (data) => {
  const response = await API.post("/add-income/", data);
  return response.data;
};

// ---------------- GET CATEGORIES ----------------
export const getCategories = async () => {
  const response = await API.get("/categories/");
  return response.data;
};

// ---------------- GET EXPENSES ----------------
export const getExpenses = async (params = {}) => {
  const response = await API.get("/show-expenses/", { params });
  return response.data;
};

// ---------------- GET USER DETAILS ----------------
export const getUserDetails = async () => {
  const response = await API.get("/user-details/");
  return response.data;
};

// ---------------- GET EXPENSE OVERVIEW ----------------
export const getExpenseOverview = async () => {
  const response = await API.get("/expense-overview/");
  return response.data;
};

// ---------------- GET ANALYTICS ----------------
export const getAnalytics = async (params = {}) => {
  const response = await API.get("/analytics/", { params });
  return response.data;
};

export default API;
export const createCategory = async (name) => {
  const response = await API.post("/categories/", { name });
  return response.data.category;
};

export const deleteAccount = async (password) => {
  await API.delete("/delete-account/", { data: { password, confirm: true } });
  sessionVersion += 1;
  clearSession();
};
