import React from "react";
import CreatorSidebar from "./CreatorSidebar";

const CreatorLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-stone-50 font-sans">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <CreatorSidebar />
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto ml-64 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default CreatorLayout;
