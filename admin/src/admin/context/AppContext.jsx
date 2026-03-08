import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AppContext = createContext();

// Create a dedicated axios instance for Admin
const adminAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
});

export const AppProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || "",
  );

  // 1. Interceptor: Automatically attach the admin token to every request header
  useEffect(() => {
    const requestInterceptor = adminAxiosInstance.interceptors.request.use(
      (config) => {
        if (adminToken) {
          config.headers.admintoken = adminToken; // Backend expects this header for Admin routes
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    return () =>
      adminAxiosInstance.interceptors.request.eject(requestInterceptor);
  }, [adminToken]);

  // 2. Sync State to LocalStorage: Automatically update localStorage when token changes
  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [adminToken]);

  // 3. Centralized Logout Function
  const adminLogout = () => {
    setAdminToken("");
    localStorage.removeItem("adminToken");
    toast.success("Logged out successfully");
  };

  const value = {
    axios: adminAxiosInstance,
    adminToken,
    setAdminToken,
    adminLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
