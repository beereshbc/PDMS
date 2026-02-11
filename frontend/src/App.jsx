import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import { useAppContext } from "./context/AppContext";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatePD from "./pages/CreatePD";
import EditPD from "./pages/EditPD";
import Preview from "./components/Preview";

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
            <Route path="/creator/edit-pd" element={<EditPD />} />
            <Route path="/creator/pd-history" element={<CreatorDashboard />} />
            <Route path="/creator/preview" element={<Preview />} />
          </>
        ) : (
          <Route path="/" element={<Login />} />
        )}
      </Routes>
    </div>
  );
};

export default App;
