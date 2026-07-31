import React from "react";
import TopNav from "@/components/common/TopNav";
import BottomNav from "@/components/common/BottomNav";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <TopNav />
      {/* pt matches TopNav height + safe-area, pb matches BottomNav height + safe-area on mobile */}
      <main className="pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
