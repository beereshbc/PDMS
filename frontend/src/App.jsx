import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import { useAppContext } from "./context/AppContext";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatePD from "./pages/CreatePD";
import Preview from "./components/Preview";
import HistoryPD from "./pages/HistoryPD";
import EditCD from "./pages/EditCD";
import PreviewCD from "./components/PreviewCD";
import HistoryCD from "./pages/HistoryCD";

const App = () => {
  const { createrToken } = useAppContext();

  return (
    <div>
      <Toaster position="top-right" />

      <Routes>
        {createrToken ? (
          <>
            <Route path="/" element={<CreatorDashboard />} />
            <Route path="/creator/create-pd" element={<CreatePD />} />
            <Route path="/creator/pd-history" element={<HistoryPD />} />
            <Route path="/creator/cd-history" element={<HistoryCD />} />

            <Route path="creator/preview-cd" element={<PreviewCD />} />
            <Route path="/creator/edit-cd" element={<EditCD />} />
          </>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </div>
  );
};

export default App;
