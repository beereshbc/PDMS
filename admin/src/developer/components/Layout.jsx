import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {/* Responsive Margin: 
        ml-20 = leaves space for the collapsed icon sidebar
        lg:ml-64 = leaves space for the fully expanded sidebar on desktop
      */}
      <main className="flex-1 transition-all duration-300 ml-20 lg:ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
