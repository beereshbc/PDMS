import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppProvider = ({ children }) => {
  const [createrToken, setCreaterToken] = useState(
    localStorage.getItem("createrToken")
      ? localStorage.getItem("createrToken")
      : null,
  );

  const navigate = useNavigate();

  const value = {
    axios,
    createrToken,
    setCreaterToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
