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
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

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
                <Route path="/partner-landing" element={<PartnerLanding />} />
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
