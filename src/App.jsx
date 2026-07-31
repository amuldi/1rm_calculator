import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./app/layout";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SplashScreen from "./components/common/SplashScreen";
import PWAStatus from "./components/common/PWAStatus";
import RuntimeDiagnostics from "./components/common/RuntimeDiagnostics";
import { useDarkMode } from "./hooks/useDarkMode";

const DashboardPage = lazy(() => import("./features/dashboard/index"));
const OneRMPage     = lazy(() => import("./features/1rm/index"));
const NutritionPage = lazy(() => import("./features/nutrition/index"));
const AnalyticsPage = lazy(() => import("./features/analytics/index"));
const ProfilePage   = lazy(() => import("./features/profile/index"));
const PrivacyPage   = lazy(() => import("./features/privacy/index"));
const ReadinessPage = lazy(() => import("./features/readiness/index"));
const DiagnosticsPage = lazy(() => import("./features/diagnostics/index"));

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="neon-rule w-16" />
    </div>
  );
}

function AppRoutes() {
  const [splash, setSplash] = useState(() => {
    if (typeof window === "undefined") return true;
    const params = new URLSearchParams(window.location.search);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    return !params.has("skipSplash") && !reduceMotion;
  });

  useEffect(() => {
    if (!splash) return undefined;
    const t = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <>
      <AnimatePresence>{splash && <SplashScreen key="splash" />}</AnimatePresence>
      {!splash && (
        <Layout>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/"           element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/calculator" element={<OneRMPage />} />
              <Route path="/nutrition"  element={<NutritionPage />} />
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
              <Route path="/privacy"    element={<PrivacyPage />} />
              <Route path="/readiness"  element={<ReadinessPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="*"           element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      )}
    </>
  );
}

export default function App() {
  useDarkMode();
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <RuntimeDiagnostics />
      <PWAStatus />
    </Router>
  );
}
