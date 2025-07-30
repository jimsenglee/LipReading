
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Transcription from "./pages/Transcription";
import Education from "./pages/Education";
import TutorialLibrary from "./pages/education/TutorialLibrary";
import TutorialPlayer from "./pages/education/TutorialPlayer";
import InteractiveQuizzes from "./pages/education/InteractiveQuizzes";
import RealTimePractice from "./pages/education/RealTimePractice";
import ProgressTracking from "./pages/education/ProgressTracking";
import NotificationSettings from "./pages/education/NotificationSettings";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import TranscriptionHistory from "./pages/TranscriptionHistory";
import TranscriptionResult from "./pages/TranscriptionResult";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import SystemAnalytics from "./pages/admin/SystemAnalytics";
import UserLearningAnalytics from "./pages/admin/UserLearningAnalytics";
import ContentInteractionAnalytics from "./pages/admin/ContentInteractionAnalytics";
import EditFAQ from "./pages/admin/EditFAQ";
import FeedbackSubmission from "./pages/FeedbackSubmission";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/transcription" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Transcription />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Education />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/tutorials" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialLibrary />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/tutorial/:id" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialPlayer />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/quizzes" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InteractiveQuizzes />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/practice" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RealTimePractice />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/progress" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProgressTracking />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/education/notifications" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotificationSettings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/transcription-history" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TranscriptionHistory />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/transcription-result/:id" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TranscriptionResult />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FeedbackSubmission />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <UserManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <ContentManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/content/faq/:id" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <EditFAQ />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/content/faq/new" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <EditFAQ />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <SystemAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/user-analytics" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <UserLearningAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/content-analytics" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout>
                  <ContentInteractionAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
