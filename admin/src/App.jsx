import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- Contexts ---
import { useAppDevContext } from "./developer/context/AppContext";
import { useAppContext } from "./admin/context/AppContext"; // Admin Context

// --- Public Pages ---
import Home from "./Home";

// --- Developer Pages ---
import DevLogin from "./developer/pages/DevLogin";
import DeveloperDashboard from "./developer/pages/DeveloperDashboard";
import AddAdmin from "./developer/pages/AddAdmin";
import AddCreater from "./developer/pages/AddCreater";
import AdminList from "./developer/pages/AdminList";
import CreaterList from "./developer/pages/CreaterList";

// --- Admin Pages ---
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import PDReviewList from "./admin/pages/PDReviewList";
import CDReviewList from "./admin/pages/CDReviewList";
import CurriculumCompiler from "./admin/pages/CurriculumCompiler";
import StaticAssetsManager from "./admin/pages/StaticAssetsManager";
import PDReviewDetail from "./admin/pages/PDReviewDetail";

const App = () => {
  const { devToken } = useAppDevContext();
  const { adminToken } = useAppContext();

  return (
    <div>
      <Toaster position="top-right" />

      <Routes>
        {/* ──────────────── PUBLIC ROUTES ──────────────── */}
        <Route path="/" element={<Home />} />
        <Route
          path="/admin/login"
          element={
            adminToken ? <Navigate to="/admin/dashboard" /> : <AdminLogin />
          }
        />
        <Route
          path="/dev/login"
          element={devToken ? <Navigate to="/dev/dashboard" /> : <DevLogin />}
        />

        {/* ──────────────── DEVELOPER PROTECTED ROUTES ──────────────── */}
        {devToken && (
          <>
            <Route path="/dev/dashboard" element={<DeveloperDashboard />} />
            <Route path="/dev/add-admin" element={<AddAdmin />} />
            <Route path="/dev/add-creator" element={<AddCreater />} />
            <Route path="/dev/admin-list" element={<AdminList />} />
            <Route path="/dev/creator-list" element={<CreaterList />} />
          </>
        )}

        {/* ──────────────── ADMIN PROTECTED ROUTES ──────────────── */}
        {adminToken && (
          <>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/pd-reviews" element={<PDReviewList />} />
            <Route path="/admin/cd-reviews" element={<CDReviewList />} />
            <Route path="/admin/compiler" element={<CurriculumCompiler />} />
            <Route path="/admin/assets" element={<StaticAssetsManager />} />
            <Route path="/admin/pd-review/:id" element={<PDReviewDetail />} />
          </>
        )}

        {/* ──────────────── FALLBACK ROUTE ──────────────── */}
        {/* If a user goes to a route that doesn't exist (or they aren't logged in to see), send them home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
