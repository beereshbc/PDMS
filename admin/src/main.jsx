import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./admin/context/AppContext.jsx";
import { AppDevProvider } from "./developer/context/AppContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppDevProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AppDevProvider>
  </BrowserRouter>,
);
