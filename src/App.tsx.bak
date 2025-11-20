import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import DiaryPage from "./pages/DiaryPage"; // Data Entry page
import Landing from "./pages/Landing";

import { AuthProvider } from "./auth/AuthContext";
import { AuthGate } from "./components/Auth/AuthGate";
import { LoginForm } from "./components/Auth/LoginForm";

import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import StatsTrendPage from "./pages/StatsTrendPage"; // NEW: metrics trend page

import NotesArchivePage from "./pages/NotesArchivePage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/landing" element={<Landing />} />

          {/* Everything inside AuthGate requires login */}
          <Route element={<AuthGate />}>
            {/* Initial entry point after login/auth check */}
            <Route path="/" element={<Index />} />

            {/* Profile setup route */}
            <Route path="/profile-setup" element={<ProfileSetup />} />

            {/* Main app pages */}
            <Route path="/diary" element={<DiaryPage />} /> {/* Daily diary / data entry */}
            <Route path="/stats" element={<Stats />} /> {/* Full stats page */}
            <Route path="/stats/trend" element={<StatsTrendPage />} /> {/* Graph-only page */}
            <Route path="/profile" element={<Profile />} /> {/* Edit profile */}
			<Route path="/notes" element={<NotesArchivePage />} />

          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
