import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import AnalyticsTracker from "./features/analytics/AnalyticsTracker";
import { getStoredGender } from "./shared/hooks/useGenderAccent";
import DevPhonePreview from "./shared/components/DevPhonePreview";

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
const GhostPaymentSuccessPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostPaymentSuccessPage"));
const GhostOnboardingPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostOnboardingPage"));
const GhostRoomsPage           = lazyWithRetry(() => import("./features/ghost/pages/GhostRoomsPage"));
const PenthouseFloorPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseFloorPage"));
const LoftFloorPage            = lazyWithRetry(() => import("./features/ghost/pages/LoftFloorPage"));
const CellarFloorPage          = lazyWithRetry(() => import("./features/ghost/pages/CellarFloorPage"));
const GhostHowItWorksPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostHowItWorksPage"));
const PenthouseApplyPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseApplyPage"));
const PenthouseVaultPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseVaultPage"));

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
  // Set data-gender on root so CSS variables can respond to gender theme
  useEffect(() => {
    const gender = getStoredGender();
    document.documentElement.setAttribute("data-gender", gender);
  }, []);

  return (
    <LanguageProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DevPhonePreview />
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
          <Route path="/ghost/rooms" element={<GhostRoomsPage />} />
          <Route path="/ghost/map"   element={<GhostMapPage />} />
          <Route path="/ghost/dashboard"       element={<GhostDashboardPage />} />
          <Route path="/ghost/payment-success" element={<GhostPaymentSuccessPage />} />
          <Route path="/ghost/onboarding"      element={<GhostOnboardingPage />} />
          <Route path="/ghost/penthouse"       element={<PenthouseFloorPage />} />
          <Route path="/ghost/penthouse/apply" element={<PenthouseApplyPage />} />
          <Route path="/ghost/penthouse/vault/:matchId" element={<PenthouseVaultPage />} />
          <Route path="/ghost/loft"                   element={<LoftFloorPage />} />
          <Route path="/ghost/cellar"                 element={<CellarFloorPage />} />
          <Route path="/ghost/how-it-works"           element={<GhostHowItWorksPage />} />

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
