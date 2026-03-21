import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import AnalyticsTracker from "./features/analytics/AnalyticsTracker";

// Retry lazy imports once on failure (handles Vite cold-start timing issues)
function lazyWithRetry<T extends { default: any }>(factory: () => Promise<T>) {
  return lazy(() => factory().catch(() => factory()));
}

const GhostLandingPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostLandingPage"));
const GhostGatewayPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostGatewayPage"));
const GhostAuthPage     = lazyWithRetry(() => import("./features/ghost/pages/GhostAuthPage"));
const GhostSetupPage    = lazyWithRetry(() => import("./features/ghost/pages/GhostSetupPage"));
const GhostModePage     = lazyWithRetry(() => import("./features/ghost/pages/GhostModePage"));
const GhostMockFeedPage = lazyWithRetry(() => import("./features/ghost/pages/GhostMockFeedPage"));
const GhostPricingPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostPricingPage"));
const GhostBlockPage    = lazyWithRetry(() => import("./features/ghost/pages/GhostBlockPage"));
const GhostRoomPage     = lazyWithRetry(() => import("./features/ghost/pages/GhostRoomPage"));
const GhostMapPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostMapPage"));
const GhostDashboardPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostDashboardPage"));
const GhostPaymentSuccessPage = lazyWithRetry(() => import("./features/ghost/pages/GhostPaymentSuccessPage"));

// Affiliate
const AffiliateJoinPage      = lazyWithRetry(() => import("./features/affiliate/pages/AffiliateJoinPage"));
const AffiliateDashboard     = lazyWithRetry(() => import("./features/affiliate/pages/AffiliateDashboard"));
const AffiliateAdminPage     = lazyWithRetry(() => import("./features/affiliate/pages/AffiliateAdminPage"));
const AffiliateRefPage        = lazyWithRetry(() => import("./features/affiliate/pages/AffiliateRefPage"));
const AffiliateHowItWorksPage = lazyWithRetry(() => import("./features/affiliate/pages/AffiliateHowItWorksPage"));

// Admin
const AdminLoginPage    = lazyWithRetry(() => import("./features/admin/AdminLoginPage"));
const AdminLayout       = lazyWithRetry(() => import("./features/admin/AdminLayout"));
const AdminOverviewPage = lazyWithRetry(() => import("./features/admin/pages/AdminOverviewPage"));
const AdminProfilesPage = lazyWithRetry(() => import("./features/admin/pages/AdminProfilesPage"));
const AdminUsersPage    = lazyWithRetry(() => import("./features/admin/pages/AdminUsersPage"));
const AdminPaymentsPage = lazyWithRetry(() => import("./features/admin/pages/AdminPaymentsPage"));
const AdminServicesPage = lazyWithRetry(() => import("./features/admin/pages/AdminServicesPage"));
const AdminTasksPage    = lazyWithRetry(() => import("./features/admin/pages/AdminTasksPage"));
const AdminHealthPage   = lazyWithRetry(() => import("./features/admin/pages/AdminHealthPage"));
const AdminTrafficPage  = lazyWithRetry(() => import("./features/admin/pages/AdminTrafficPage"));

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnalyticsTracker />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/"               element={<Navigate to="/ghost" replace />} />
          <Route path="/ghost"         element={<GhostLandingPage />} />
          <Route path="/ghost/auth"    element={<GhostAuthPage />} />
          <Route path="/ghost/gateway" element={<GhostGatewayPage />} />
          <Route path="/ghost/setup" element={<GhostSetupPage />} />
          <Route path="/ghost/mode"  element={<GhostModePage />} />
          <Route path="/ghost/mock"  element={<GhostMockFeedPage />} />
          <Route path="/ghost/pricing" element={<GhostPricingPage />} />
          <Route path="/ghost/block" element={<GhostBlockPage />} />
          <Route path="/ghost/room"  element={<GhostRoomPage />} />
          <Route path="/ghost/map"   element={<GhostMapPage />} />
          <Route path="/ghost/dashboard"       element={<GhostDashboardPage />} />
          <Route path="/ghost/payment-success" element={<GhostPaymentSuccessPage />} />

          {/* Affiliate */}
          <Route path="/affiliate/join"          element={<AffiliateJoinPage />} />
          <Route path="/affiliate/dashboard"     element={<AffiliateDashboard />} />
          <Route path="/affiliate/admin"         element={<AffiliateAdminPage />} />
          <Route path="/affiliate/ref/:code"     element={<AffiliateRefPage />} />
          <Route path="/affiliate/how-it-works" element={<AffiliateHowItWorksPage />} />

          {/* Admin — separate login page, then layout-wrapped dashboard */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview"  element={<AdminOverviewPage />} />
            <Route path="tasks"     element={<AdminTasksPage />} />
            <Route path="health"    element={<AdminHealthPage />} />
            <Route path="traffic"   element={<AdminTrafficPage />} />
            <Route path="profiles"  element={<AdminProfilesPage />} />
            <Route path="users"     element={<AdminUsersPage />} />
            <Route path="payments"  element={<AdminPaymentsPage />} />
            <Route path="services"  element={<AdminServicesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/ghost" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </LanguageProvider>
  );
}
