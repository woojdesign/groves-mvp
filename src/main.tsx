import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import "./index.css";
import "./styles/components.css";

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
    </Routes>
  </BrowserRouter>
);
