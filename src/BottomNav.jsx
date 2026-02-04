import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Activity, TrendingUp, Search } from "lucide-react";

const tabs = [
  { name: "대시보드", path: "/dashboard", icon: <Home size={20} /> },
  { name: "1RM 계산기", path: "/one-rm", icon: <BarChart2 size={20} /> },
  { name: "운동 분석", path: "/insight", icon: <TrendingUp size={20} /> },
  { name: "운동 탐색", path: "/explore", icon: <Search size={20} /> },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-gray-700 shadow-sm h-20 flex justify-around items-center">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center text-xs sm:text-sm px-4 py-1 rounded-lg transition-all duration-200 ${
              isActive
                ? "text-black dark:text-white font-bold"
                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            {React.cloneElement(tab.icon, { size: 24 })}
            <span className="mt-1 font-semibold">{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
