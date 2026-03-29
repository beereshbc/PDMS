import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AppDevContext = createContext();

const devInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
});

export const AppDevProvider = ({ children }) => {
  const [devToken, setDevToken] = useState(
    localStorage.getItem("devToken") || "",
  );

  useEffect(() => {
    const requestInterceptor = devInstance.interceptors.request.use(
      (config) => {
        if (devToken) {
          // Matches backend 'devtoken' header
          config.headers.devtoken = devToken;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
    return () => devInstance.interceptors.request.eject(requestInterceptor);
  }, [devToken]);

  const value = {
    axios: devInstance,
    devToken,
    setDevToken,
  };

  return (
    <AppDevContext.Provider value={value}>{children}</AppDevContext.Provider>
  );
};

export const useAppDevContext = () => useContext(AppDevContext);
