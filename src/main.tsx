import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import Welcome from "./components/Welcome.tsx";
import AuthCallback from "./components/AuthCallback.tsx";
import Onboarding from "./components/Onboarding.tsx";
import MatchingAnimation from "./components/MatchingAnimation.tsx";
import Dashboard from "./components/Dashboard.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import ShowcaseListen from "./showcase/ShowcaseListen.tsx";
import ShowcaseLearn from "./showcase/ShowcaseLearn.tsx";
import ShowcaseConnect from "./showcase/ShowcaseConnect.tsx";
import { AdminRoute } from "./admin/AdminRoute.tsx";
import { AdminLayout } from "./admin/components/AdminLayout.tsx";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage.tsx";
import { UsersPage } from "./admin/pages/UsersPage.tsx";
import { AuditLogsPage } from "./admin/pages/AuditLogsPage.tsx";
import { SettingsPage } from "./admin/pages/SettingsPage.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { initCsrf } from "./lib/api.ts";
import "./index.css";
import "./styles/components.css";

// Initialize Sentry for error tracking
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Initialize CSRF token before rendering app
initCsrf().then(() => {
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <Routes>
        {/* Main application routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/auth/verify" element={<AuthCallback />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching"
          element={
            <ProtectedRoute>
              <MatchingAnimation onComplete={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy dev mode route (for backward compatibility) */}
        <Route path="/dev" element={<App />} />

        {/* Showcase routes */}
        <Route path="/showcase/listen" element={<ShowcaseListen />} />
        <Route path="/showcase/learn" element={<ShowcaseLearn />} />
        <Route path="/showcase/connect" element={<ShowcaseConnect />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
});
