import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import BusinessBySlug from "./pages/BusinessBySlug";
import ReferralRedirect from "./pages/ReferralRedirect";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import TermsAcceptanceModal from "./components/TermsAcceptanceModal";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const TermsGate = () => {
  const { user, termsAccepted, setTermsAccepted } = useAuth();
  if (!user || termsAccepted) return null;
  return (
    <TermsAcceptanceModal
      open={true}
      userId={user.id}
      onAccepted={() => setTermsAccepted(true)}
    />
  );
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
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/b/:slug" element={<BusinessBySlug />} />
                <Route path="/ref/:code" element={<ReferralRedirect />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
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
