import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/hooks/usePreferences";
import Index from "./pages/Index";
import ServiceDetail from "./pages/ServiceDetail";
import BookingConfirm from "./pages/BookingConfirm";
import Deals from "./pages/Deals";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Partner from "./pages/Partner";
import PartnerLanding from "./pages/PartnerLanding";
import AuthPartner from "./pages/AuthPartner";
import Admin from "./pages/Admin";
import PartnerBookings from "./pages/partner/PartnerBookings";
import PartnerClients from "./pages/partner/PartnerClients";
import PartnerAnalytics from "./pages/partner/PartnerAnalytics";
import PartnerServices from "./pages/partner/PartnerServices";
import PartnerStaff from "./pages/partner/PartnerStaff";
import PartnerCompanySettings from "./pages/partner/PartnerCompanySettings";
import PartnerDeals from "./pages/partner/PartnerDeals";
import PartnerQueue from "./pages/partner/PartnerQueue";
import PartnerFinance from "./pages/partner/PartnerFinance";
import PartnerInventory from "./pages/partner/PartnerInventory";
import PartnerMenu from "./pages/partner/PartnerMenu";
import PartnerOrders from "./pages/partner/PartnerOrders";
import PartnerTables from "./pages/partner/PartnerTables";
import CafeTable from "./pages/CafeTable";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Help from "./pages/Help";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import BusinessBySlug from "./pages/BusinessBySlug";
import ReferralRedirect from "./pages/ReferralRedirect";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import TermsPartner from "./pages/TermsPartner";
import ReviewRules from "./pages/ReviewRules";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import Transport from "./pages/Transport";
import TransportResults from "./pages/TransportResults";
import TermsAcceptanceModal from "./components/TermsAcceptanceModal";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const TermsGate = () => {
  const { user, termsAccepted, setTermsAccepted, partnerTermsAccepted, setPartnerTermsAccepted } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const isPartnerRoute = location.pathname.startsWith('/auth/partner') || location.pathname.startsWith('/partner');

  // On partner routes, check partner terms
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

  // On all routes, check client terms
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
