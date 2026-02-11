import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import DevLogin from "./developer/pages/DevLogin";
import AdminLogin from "./admin/pages/AdminLogin";
import Home from "./Home";
import { useAppDevContext } from "./developer/context/AppContext";
import DeveloperDashboard from "./developer/pages/DeveloperDashboard";
import AddAdmin from "./developer/pages/AddAdmin";
import AddCreater from "./developer/pages/AddCreater";
import AdminList from "./developer/pages/AdminList";
import CreaterList from "./developer/pages/CreaterList";

const App = () => {
  const { devToken } = useAppDevContext();
  return (
    <div>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/dev/login" element={<DevLogin />} />
      </Routes>
      <Routes>
        {devToken ? (
          <>
            <Route path="/dev/dashboard" element={<DeveloperDashboard />} />
            <Route path="/dev/add-admin" element={<AddAdmin />} />
            <Route path="/dev/add-creator" element={<AddCreater />} />
            <Route path="/dev/admin-list" element={<AdminList />} />
            <Route path="/dev/creator-list" element={<CreaterList />} />
          </>
        ) : (
          <>
            <Route path="/dev/login" element={<DevLogin />} />
          </>
        )}
      </Routes>
    </div>
  );
};

export default App;
