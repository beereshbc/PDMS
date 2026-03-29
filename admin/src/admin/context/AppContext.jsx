import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AppContext = createContext();

// 1. Create the instance
const adminAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
});

export const AppProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || "",
  );

  // 2. The Interceptor - This is the bridge that fixes the 401
  useEffect(() => {
    const requestInterceptor = adminAxiosInstance.interceptors.request.use(
      (config) => {
        if (adminToken) {
          // This must match 'admintoken' in your backend middleware
          config.headers.admintoken = adminToken;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    return () =>
      adminAxiosInstance.interceptors.request.eject(requestInterceptor);
  }, [adminToken]);

  // 3. Sync to LocalStorage
  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
      console.log(adminToken);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [adminToken]);

  const adminLogout = () => {
    setAdminToken("");
    localStorage.removeItem("adminToken");
    toast.success("Logged out successfully");
  };

  const value = {
    axios: adminAxiosInstance, // Components use this
    adminToken,
    setAdminToken,
    adminLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
