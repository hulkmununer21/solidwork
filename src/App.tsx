import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import SplashPage from "./pages/SplashPage";
import OnboardingPage from "./pages/OnboardingPage";
import UserTypeSelectionPage from "./pages/UserTypeSelectionPage";
import { AdminRoute } from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from './pages/AdminDashboardPage';
import DashboardPage from "./pages/DashboardPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import ProviderSchedulePage from "./pages/ProviderSchedulePage";
import ProviderMessagesPage from "./pages/ProviderMessagesPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import AdminLoginPage from './pages/AdminLoginPage';
import BookingsPage from "./pages/BookingsPage";
import BookNowPage from "./pages/BookNowPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import RatingsReviewsPage from "./pages/RatingsReviewsPage";
import HealthRecordsPage from "./pages/HealthRecordsPage";
import LifestyleTrackingPage from "./pages/LifestyleTrackingPage";
import WearableIntegrationPage from "./pages/WearableIntegrationPage";
import AIRemediesPage from "./pages/AIRemediesPage";
import XrayExplainerPage from "./pages/XrayExplainerPage";
import PharmacyMapPage from "./pages/PharmacyMapPage";
import InsuranceIntegrationPage from "./pages/InsuranceIntegrationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ProtectedRoute component
const ProtectedRoute = () => {
  const token = localStorage.getItem('ahs_auth_token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Unprotected routes */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/splash" element={<SplashPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/user-type" element={<UserTypeSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            {/* Admin Routes - MOVED OUTSIDE ProtectedRoute */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              {/* Add more admin routes here later */}
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/provider-dashboard" element={<ProviderDashboardPage />} />
              <Route path="/provider-schedule" element={<ProviderSchedulePage />} />
              <Route path="/provider-messages" element={<ProviderMessagesPage />} />
              <Route path="/provider-profile" element={<ProviderProfilePage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/book-now" element={<BookNowPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/ratings-reviews" element={<RatingsReviewsPage />} />
              <Route path="/health-records" element={<HealthRecordsPage />} />
              <Route path="/lifestyle-tracking" element={<LifestyleTrackingPage />} />
              <Route path="/wearable-integration" element={<WearableIntegrationPage />} />
              <Route path="/ai-remedies" element={<AIRemediesPage />} />
              <Route path="/xray-explainer" element={<XrayExplainerPage />} />
              <Route path="/pharmacy-map" element={<PharmacyMapPage />} />
              <Route path="/insurance-integration" element={<InsuranceIntegrationPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
