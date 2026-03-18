import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Dumbbell, BarChart3, User } from "lucide-react";

const TABS = [
  { path: "/dashboard",  icon: LayoutDashboard, label: "홈" },
  { path: "/calculator", icon: Dumbbell,        label: "계산기" },
  { path: "/analytics",  icon: BarChart3,       label: "분석" },
  { path: "/profile",    icon: User,            label: "프로필" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(6,9,18,0.95)",
        borderTop: "1px solid rgba(0,200,255,0.10)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 min-w-[56px]"
            >
              {active && (
                <motion.div
                  layoutId="bottom-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--accent-faint)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={21}
                strokeWidth={active ? 2.2 : 1.75}
                style={{
                  position: "relative",
                  color: active ? "var(--accent)" : "var(--text-3)",
                  filter: active ? "drop-shadow(0 0 6px var(--accent))" : "none",
                }}
              />
              <span
                className="relative text-[10px] font-semibold tracking-wide"
                style={{ color: active ? "var(--accent)" : "var(--text-3)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
