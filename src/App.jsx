import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./app/layout";
import SplashScreen from "./components/common/SplashScreen";
import { useDarkMode } from "./hooks/useDarkMode";

const DashboardPage = lazy(() => import("./features/dashboard/index"));
const OneRMPage     = lazy(() => import("./features/1rm/index"));
const AnalyticsPage = lazy(() => import("./features/analytics/index"));
const ProfilePage   = lazy(() => import("./features/profile/index"));

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="gold-rule w-16" />
    </div>
  );
}

function AppRoutes() {
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

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
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
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
    <Router>
      <AppRoutes />
    </Router>
  );
}
