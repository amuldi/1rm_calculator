import React from "react";
import TopNav from "@/components/common/TopNav";
import BottomNav from "@/components/common/BottomNav";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <TopNav />
      {/* pt-14 = TopNav height, pb-16 on mobile for BottomNav */}
      <main className="pt-14 pb-16 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
