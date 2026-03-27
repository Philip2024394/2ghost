import { lazy, Suspense, useEffect, ComponentType } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import AnalyticsTracker from "./features/analytics/AnalyticsTracker";
import { getStoredGender } from "./shared/hooks/useGenderAccent";
import DevPhonePreview from "./shared/components/DevPhonePreview";

// Retry lazy imports once on failure (handles Vite cold-start timing issues)
function lazyWithRetry<T extends { default: any }>(factory: () => Promise<T>) {
  return lazy(() => factory().catch(() => factory()));
}

const GhostWelcomePage  = lazyWithRetry(() => import("./features/ghost/pages/GhostWelcomePage"));
const GhostGatewayPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostGatewayPage"));
const GhostAuthPage     = lazyWithRetry(() => import("./features/ghost/pages/GhostAuthPage"));
const GhostSetupPage    = lazyWithRetry(() => import("./features/ghost/pages/GhostSetupPage"));
const GhostModePage     = lazyWithRetry(() => import("./features/ghost/pages/GhostModePage"));
const GhostPricingPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostPricingPage"));
const GhostBlockPage    = lazyWithRetry(() => import("./features/ghost/pages/GhostBlockPage"));
const GhostRoomPage     = lazyWithRetry(() => import("./features/ghost/pages/GhostRoomPage"));
const GhostMapPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostMapPage"));
const GhostDashboardPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostDashboardPage"));
const GhostPaymentSuccessPage  = lazyWithRetry(() => import("./features/ghost/pages/GhostPaymentSuccessPage"));
const GhostOnboardingPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostOnboardingPage"));
const GhostProfileSetupPage    = lazyWithRetry(() => import("./features/ghost/pages/GhostProfileSetupPage"));
const MrButlasEscortPage       = lazyWithRetry(() => import("./features/ghost/pages/MrButlasEscortPage"));
const GhostRoomsPage           = lazyWithRetry(() => import("./features/ghost/pages/GhostRoomsPage"));
const PenthouseFloorPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseFloorPage"));
const LoftFloorPage            = lazyWithRetry(() => import("./features/ghost/pages/LoftFloorPage"));
const CellarFloorPage          = lazyWithRetry(() => import("./features/ghost/pages/CellarFloorPage"));
const FloorRoomPage            = lazyWithRetry(() => import("./features/ghost/pages/FloorRoomPage")) as ComponentType<{ tier: "cellar" | "loft" | "suite" | "penthouse" | "standard" | "garden" | "kings" }>;
const GhostHowItWorksPage      = lazyWithRetry(() => import("./features/ghost/pages/GhostHowItWorksPage"));
const PenthouseApplyPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseApplyPage"));
const PenthouseVaultPage       = lazyWithRetry(() => import("./features/ghost/pages/PenthouseVaultPage"));
const HotelCheckoutPage        = lazyWithRetry(() => import("./features/ghost/pages/HotelCheckoutPage"));
const Connect4Page             = lazyWithRetry(() => import("./features/ghost/pages/Connect4Page"));
const MemoryMatchPage          = lazyWithRetry(() => import("./features/ghost/pages/MemoryMatchPage"));
const WordDuelPage             = lazyWithRetry(() => import("./features/ghost/pages/WordDuelPage"));
const GamesRoomLandingPage     = lazyWithRetry(() => import("./features/ghost/pages/GamesRoomLandingPage"));
const GamesRoomPage            = lazyWithRetry(() => import("./features/ghost/pages/GamesRoomPage"));
const HotelRulesPage           = lazyWithRetry(() => import("./features/ghost/pages/HotelRulesPage"));
const BreakfastLoungePage      = lazyWithRetry(() => import("./features/ghost/pages/BreakfastLoungePage"));
const HotelActivitiesPage        = lazyWithRetry(() => import("./features/ghost/pages/HotelActivitiesPage"));
const HotelRoomDetailPage        = lazyWithRetry(() => import("./features/ghost/pages/HotelRoomDetailPage"));

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
const AdminPaymentsPage     = lazyWithRetry(() => import("./features/admin/pages/AdminPaymentsPage"));
const AdminStripeReportPage = lazyWithRetry(() => import("./features/admin/pages/AdminStripeReportPage"));
const AdminServicesPage = lazyWithRetry(() => import("./features/admin/pages/AdminServicesPage"));
const AdminTasksPage    = lazyWithRetry(() => import("./features/admin/pages/AdminTasksPage"));
const AdminHealthPage   = lazyWithRetry(() => import("./features/admin/pages/AdminHealthPage"));
const AdminTrafficPage      = lazyWithRetry(() => import("./features/admin/pages/AdminTrafficPage"));
const AdminUserControlPage  = lazyWithRetry(() => import("./features/admin/pages/AdminUserControlPage"));
const AdminGiftsPage        = lazyWithRetry(() => import("./features/admin/pages/AdminGiftsPage"));
const AdminActivitiesPage   = lazyWithRetry(() => import("./features/admin/pages/AdminActivitiesPage"));
const PrivacyPolicyPage     = lazyWithRetry(() => import("./features/ghost/pages/PrivacyPolicyPage"));
const TermsOfServicePage    = lazyWithRetry(() => import("./features/ghost/pages/TermsOfServicePage"));
const SupportPage           = lazyWithRetry(() => import("./features/ghost/pages/SupportPage"));
const MrButlasTermsPage     = lazyWithRetry(() => import("./features/ghost/pages/MrButlasTermsPage"));

// Request push notification permission and subscribe to push
async function requestPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  if (Notification.permission === "granted") return;
  if (Notification.permission === "denied") return;
  // Delay slightly so it doesn't fire on first load before user interaction
  await Notification.requestPermission();
}

export default function App() {
  // Set data-gender on root so CSS variables can respond to gender theme
  useEffect(() => {
    const gender = getStoredGender();
    document.documentElement.setAttribute("data-gender", gender);
  }, []);

  // Request push permission after a short delay (not on cold first visit)
  useEffect(() => {
    const t = setTimeout(() => {
      // Only request if user has been to the app before (has ghost profile)
      if (localStorage.getItem("ghost_phone") || localStorage.getItem("ghost_profile")) {
        requestPushPermission();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <LanguageProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DevPhonePreview />
      <AnalyticsTracker />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={
            localStorage.getItem("ghost_profile_setup_done")
              ? <Navigate to="/mode" replace />
              : <Navigate to="/welcome" replace />
          } />
          <Route path="/auth"    element={<GhostAuthPage />} />
          <Route path="/gateway" element={<GhostGatewayPage />} />
          <Route path="/setup" element={<GhostSetupPage />} />
          <Route path="/mode"  element={<GhostModePage />} />
          <Route path="/pricing" element={<GhostPricingPage />} />
          <Route path="/block" element={<GhostBlockPage />} />
          <Route path="/room"  element={<GhostRoomPage />} />
          <Route path="/rooms" element={<GhostRoomsPage />} />
          <Route path="/map"   element={<GhostMapPage />} />
          <Route path="/dashboard"       element={<GhostDashboardPage />} />
          <Route path="/payment-success" element={<GhostPaymentSuccessPage />} />
          <Route path="/onboarding"      element={<GhostOnboardingPage />} />
          <Route path="/profile-setup"  element={<GhostProfileSetupPage />} />
          <Route path="/escorted-out"   element={<MrButlasEscortPage />} />
          <Route path="/penthouse"       element={<PenthouseFloorPage />} />
          <Route path="/penthouse/apply" element={<PenthouseApplyPage />} />
          <Route path="/penthouse/vault/:matchId" element={<PenthouseVaultPage />} />
          <Route path="/loft"                   element={<LoftFloorPage />} />
          <Route path="/cellar"                 element={<CellarFloorPage />} />
          <Route path="/floor/suite"             element={<FloorRoomPage tier="suite" />} />
          <Route path="/floor/kings"            element={<FloorRoomPage tier="kings" />} />
          <Route path="/floor/penthouse-floor"  element={<FloorRoomPage tier="penthouse" />} />
          <Route path="/floor/loft-floor"       element={<FloorRoomPage tier="loft" />} />
          <Route path="/floor/cellar-floor"     element={<FloorRoomPage tier="cellar" />} />
          <Route path="/floor/standard"         element={<FloorRoomPage tier="standard" />} />
          <Route path="/floor/garden"           element={<FloorRoomPage tier="garden" />} />
          <Route path="/how-it-works"           element={<GhostHowItWorksPage />} />
          <Route path="/hotel-rules"                 element={<HotelRulesPage />} />
          <Route path="/checkout"              element={<HotelCheckoutPage />} />
          <Route path="/games"                  element={<GamesRoomLandingPage />} />
          <Route path="/games/lobby"            element={<GamesRoomPage />} />
          <Route path="/games/connect4"        element={<Connect4Page />} />
          <Route path="/games/memory"          element={<MemoryMatchPage />} />
          <Route path="/games/wordduel"       element={<WordDuelPage />} />
          <Route path="/breakfast-lounge"     element={<BreakfastLoungePage />} />
          <Route path="/activities"           element={<HotelActivitiesPage />} />
          <Route path="/room-detail/:roomId"  element={<HotelRoomDetailPage />} />
          <Route path="/privacy-policy"             element={<PrivacyPolicyPage />} />
          <Route path="/terms"                      element={<TermsOfServicePage />} />
          <Route path="/support"                    element={<SupportPage />} />
          <Route path="/mrbutlas/terms"             element={<MrButlasTermsPage />} />

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
            <Route path="stripe"    element={<AdminStripeReportPage />} />
            <Route path="services"  element={<AdminServicesPage />} />
            <Route path="control"   element={<AdminUserControlPage />} />
            <Route path="gifts"      element={<AdminGiftsPage />} />
            <Route path="activities" element={<AdminActivitiesPage />} />
          </Route>

          <Route path="/welcome" element={<GhostWelcomePage />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </LanguageProvider>
  );
}
