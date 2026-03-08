import React from "react";
import CreatorSidebar from "./CreatorSidebar";

const CreatorLayout = ({ children }) => {
  return (
    // Added overflow-hidden to prevent the whole page from scrolling
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden">
      {/* Sidebar - Now part of standard Flex flow */}
      <CreatorSidebar />

      {/* Main Scrollable Content */}
      {/* Removed ml-64. flex-1 will automatically fill the remaining space */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default CreatorLayout;
