import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/hooks/usePreferences";
import TermsAcceptanceModal from "./components/TermsAcceptanceModal";
import { useAuth } from "./hooks/useAuth";

// Eagerly load the landing page for fastest FCP
import Index from "./pages/Index";
import PageLoader from "./components/PageLoader";

// Lazy-load all other pages
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const BookingConfirm = lazy(() => import("./pages/BookingConfirm"));
const Deals = lazy(() => import("./pages/Deals"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Partner = lazy(() => import("./pages/Partner"));
const PartnerLanding = lazy(() => import("./pages/PartnerLanding"));
const AuthPartner = lazy(() => import("./pages/AuthPartner"));
const Admin = lazy(() => import("./pages/Admin"));
const PartnerBookings = lazy(() => import("./pages/partner/PartnerBookings"));
const PartnerClients = lazy(() => import("./pages/partner/PartnerClients"));
const PartnerAnalytics = lazy(() => import("./pages/partner/PartnerAnalytics"));
const PartnerServices = lazy(() => import("./pages/partner/PartnerServices"));
const PartnerStaff = lazy(() => import("./pages/partner/PartnerStaff"));
const PartnerCompanySettings = lazy(() => import("./pages/partner/PartnerCompanySettings"));
const PartnerDeals = lazy(() => import("./pages/partner/PartnerDeals"));
const PartnerQueue = lazy(() => import("./pages/partner/PartnerQueue"));
const PartnerFinance = lazy(() => import("./pages/partner/PartnerFinance"));
const PartnerInventory = lazy(() => import("./pages/partner/PartnerInventory"));
const PartnerMenu = lazy(() => import("./pages/partner/PartnerMenu"));
const PartnerOrders = lazy(() => import("./pages/partner/PartnerOrders"));
const PartnerTables = lazy(() => import("./pages/partner/PartnerTables"));
const PartnerReviews = lazy(() => import("./pages/partner/PartnerReviews"));
const CafeTable = lazy(() => import("./pages/CafeTable"));
const Settings = lazy(() => import("./pages/Settings"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Help = lazy(() => import("./pages/Help"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const BusinessBySlug = lazy(() => import("./pages/BusinessBySlug"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TermsPartner = lazy(() => import("./pages/TermsPartner"));
const ReviewRules = lazy(() => import("./pages/ReviewRules"));
const Tours = lazy(() => import("./pages/Tours"));
const TourDetail = lazy(() => import("./pages/TourDetail"));
const Sport = lazy(() => import("./pages/Sport"));
const FindGame = lazy(() => import("./pages/FindGame"));
const SportVenueDetail = lazy(() => import("./pages/SportVenueDetail"));
const Transport = lazy(() => import("./pages/Transport"));
const TransportResults = lazy(() => import("./pages/TransportResults"));
const Flights = lazy(() => import("./pages/Flights"));
const FlightResults = lazy(() => import("./pages/FlightResults"));
const Stay = lazy(() => import("./pages/Stay"));
const StayDetail = lazy(() => import("./pages/StayDetail"));
const Reviews = lazy(() => import("./pages/Reviews"));
const SeedDemo = lazy(() => import("./pages/SeedDemo"));
const InstagramCallback = lazy(() => import("./pages/InstagramCallback"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 3 * 60 * 1000,
      retry: 1,
    }
  }
});

const TermsGate = () => {
  const { user, termsAccepted, setTermsAccepted, partnerTermsAccepted, setPartnerTermsAccepted } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const isPartnerRoute = location.pathname.startsWith('/auth/partner') || location.pathname.startsWith('/partner');

  if (isPartnerRoute && !partnerTermsAccepted) {
    return (
      <TermsAcceptanceModal
        open={true}
        userId={user.id}
        variant="partner"
        onAccepted={() => setPartnerTermsAccepted(true)}
      />
    );
  }

  if (!termsAccepted) {
    return (
      <TermsAcceptanceModal
        open={true}
        userId={user.id}
        variant="client"
        onAccepted={() => setTermsAccepted(true)}
      />
    );
  }

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <TermsGate />
            <div className="lg:max-w-none max-w-lg mx-auto min-h-screen">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/service/:id" element={<ServiceDetail />} />
                  <Route path="/booking-confirm" element={<BookingConfirm />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/partner" element={<Partner />} />
                  <Route path="/partner/bookings" element={<PartnerBookings />} />
                  <Route path="/partner/clients" element={<PartnerClients />} />
                  <Route path="/partner/analytics" element={<PartnerAnalytics />} />
                  <Route path="/partner/services" element={<PartnerServices />} />
                  <Route path="/partner/staff" element={<PartnerStaff />} />
                  <Route path="/partner/settings" element={<PartnerCompanySettings />} />
                  <Route path="/partner/deals" element={<PartnerDeals />} />
                  <Route path="/partner/queue" element={<PartnerQueue />} />
                  <Route path="/partner/finance" element={<PartnerFinance />} />
                  <Route path="/partner/inventory" element={<PartnerInventory />} />
                  <Route path="/partner/menu" element={<PartnerMenu />} />
                  <Route path="/partner/orders" element={<PartnerOrders />} />
                  <Route path="/partner/tables" element={<PartnerTables />} />
                  <Route path="/partner/reviews" element={<PartnerReviews />} />
                  <Route path="/cafe/:slug/table/:tableNum" element={<CafeTable />} />
                  <Route path="/partner-landing" element={<PartnerLanding />} />
                  <Route path="/auth/partner" element={<AuthPartner />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/b/:slug" element={<BusinessBySlug />} />
                  <Route path="/ref/:code" element={<ReferralRedirect />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-partner" element={<TermsPartner />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/review-rules" element={<ReviewRules />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/tours/:id" element={<TourDetail />} />
                  <Route path="/sport" element={<Sport />} />
                  <Route path="/sport/games" element={<FindGame />} />
                  <Route path="/sport/venues" element={<Sport />} />
                  <Route path="/sport/venue/:id" element={<SportVenueDetail />} />
                  <Route path="/transport" element={<Transport />} />
                  <Route path="/transport/results" element={<TransportResults />} />
                  <Route path="/flights" element={<Flights />} />
                  <Route path="/flights/results" element={<FlightResults />} />
                  <Route path="/stay" element={<Stay />} />
                  <Route path="/stay/:id" element={<StayDetail />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/seed-demo" element={<SeedDemo />} />
                  <Route path="/instagram-callback" element={<InstagramCallback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
