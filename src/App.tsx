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
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <div className="max-w-lg mx-auto min-h-screen">
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
                <Route path="/partner-landing" element={<PartnerLanding />} />
                <Route path="/notifications" element={<Notifications />} />
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
