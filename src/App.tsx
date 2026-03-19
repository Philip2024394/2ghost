import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const GhostGatewayPage  = lazy(() => import("./features/ghost/pages/GhostGatewayPage"));
const GhostAuthPage     = lazy(() => import("./features/ghost/pages/GhostAuthPage"));
const GhostSetupPage    = lazy(() => import("./features/ghost/pages/GhostSetupPage"));
const GhostModePage     = lazy(() => import("./features/ghost/pages/GhostModePage"));
const GhostMockFeedPage = lazy(() => import("./features/ghost/pages/GhostMockFeedPage"));
const GhostPricingPage  = lazy(() => import("./features/ghost/pages/GhostPricingPage"));
const GhostBlockPage    = lazy(() => import("./features/ghost/pages/GhostBlockPage"));
const GhostRoomPage     = lazy(() => import("./features/ghost/pages/GhostRoomPage"));
const GhostMapPage      = lazy(() => import("./features/ghost/pages/GhostMapPage"));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/"            element={<Navigate to="/ghost" replace />} />
          <Route path="/ghost"       element={<GhostGatewayPage />} />
          <Route path="/ghost/auth"  element={<GhostAuthPage />} />
          <Route path="/ghost/setup" element={<GhostSetupPage />} />
          <Route path="/ghost/mode"  element={<GhostModePage />} />
          <Route path="/ghost/mock"  element={<GhostMockFeedPage />} />
          <Route path="/ghost/pricing" element={<GhostPricingPage />} />
          <Route path="/ghost/block" element={<GhostBlockPage />} />
          <Route path="/ghost/room"  element={<GhostRoomPage />} />
          <Route path="/ghost/map"   element={<GhostMapPage />} />
          <Route path="*"            element={<Navigate to="/ghost" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
