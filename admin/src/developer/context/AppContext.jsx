import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AppDevContext = createContext();

// Create a dedicated axios instance instead of modifying the global default
// This prevents conflicts if you have other types of users (like Admins)
const devInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
});

export const AppDevProvider = ({ children }) => {
  const [devToken, setDevToken] = useState(
    localStorage.getItem("devToken") || "",
  );

  // Interceptor: Automatically attach the token to every request made via this context
  useEffect(() => {
    const requestInterceptor = devInstance.interceptors.request.use(
      (config) => {
        if (devToken) {
          config.headers.token = devToken; // Matches backend expectations for protected routes
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    return () => devInstance.interceptors.request.eject(requestInterceptor);
  }, [devToken]);

  // Keep localStorage in sync when devToken changes
  useEffect(() => {
    if (devToken) {
      localStorage.setItem("devToken", devToken);
    } else {
      localStorage.removeItem("devToken");
    }
  }, [devToken]);

  const logout = () => {
    setDevToken("");
    localStorage.removeItem("devToken");
  };

  const value = {
    axios: devInstance, // Use the instance with the interceptor
    devToken,
    setDevToken,
    logout,
  };

  return (
    <AppDevContext.Provider value={value}>{children}</AppDevContext.Provider>
  );
};

export const useAppDevContext = () => {
  const context = useContext(AppDevContext);
  if (!context) {
    throw new Error("useAppDevContext must be used within an AppDevProvider");
  }
  return context;
};
