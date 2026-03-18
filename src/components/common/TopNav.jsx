import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Dumbbell } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useDarkMode } from "@/hooks/useDarkMode";

const NAV_ITEMS = [
  { path: "/dashboard",  label: "대시보드" },
  { path: "/calculator", label: "1RM 계산기" },
  { path: "/analytics",  label: "분석" },
  { path: "/profile",    label: "프로필" },
];

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unit, setUnit } = useUIStore();
  const { isDark, toggle } = useDarkMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = (path) => { navigate(path); setDrawerOpen(false); };

  return (
    <>
      {/* ── Top bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14"
        style={{
          background: "rgba(6,9,18,0.90)",
          borderBottom: "1px solid rgba(0,200,255,0.10)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-4xl mx-auto h-full px-5 flex items-center gap-6">

          {/* Logo */}
          <button
            onClick={() => go("/dashboard")}
            className="shrink-0 flex items-center gap-2"
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: "var(--accent-faint)", border: "1px solid var(--accent-border)" }}
            >
              <Dumbbell size={15} style={{ color: "var(--accent)" }} />
            </div>
            <span className="font-black text-sm tracking-tight" style={{ color: "var(--text-1)" }}>
              1RM
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map(({ path, label }) => {
              const active = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className="relative px-4 py-1.5 text-xs font-semibold tracking-wide rounded-lg transition-colors duration-150"
                  style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "var(--accent-faint)", border: "1px solid var(--accent-border)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Unit */}
            <div
              className="hidden sm:flex gap-0.5 p-0.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {["kg", "lb"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all"
                  style={{
                    background: unit === u ? "var(--accent)" : "transparent",
                    color: unit === u ? "#060912" : "var(--text-2)",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Dark mode */}
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-2)" }}
            >
              {drawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(6,9,18,0.75)", backdropFilter: "blur(8px)" }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-64 md:hidden flex flex-col"
              style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 h-14"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <Dumbbell size={16} style={{ color: "var(--accent)" }} />
                  <span className="font-black text-sm" style={{ color: "var(--text-1)" }}>1RM 계산기</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ color: "var(--text-3)" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 py-4 px-3 space-y-1">
                {NAV_ITEMS.map(({ path, label }) => {
                  const active = pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => go(path)}
                      className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all"
                      style={{
                        background: active ? "var(--accent-faint)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-2)",
                        border: `1px solid ${active ? "var(--accent-border)" : "transparent"}`,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>

              {/* Unit in drawer */}
              <div className="p-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div
                  className="flex gap-0.5 p-0.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  {["kg", "lb"].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className="flex-1 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all"
                      style={{
                        background: unit === u ? "var(--accent)" : "transparent",
                        color: unit === u ? "#060912" : "var(--text-2)",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
