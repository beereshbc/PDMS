import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Fixed Width */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area - Grow to fill space */}
      <main className="flex-1 overflow-y-auto ml-64 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
