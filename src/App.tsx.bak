import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import Landing from "./pages/Landing";

import { AuthProvider } from "./auth/AuthContext";
import { AuthGate } from "./components/Auth/AuthGate";
import { LoginForm } from "./components/Auth/LoginForm";

import Stats from "./pages/Stats"; // Full stats page
import StatsTrendPage from "./pages/StatsTrendPage"; // Graph-only page
import Profile from "./pages/Profile"; // Edit profile
import NotesArchivePage from "./pages/NotesArchivePage"; // Notes archive

// NEW: Morning / Session pages
import MorningCheckinPage from "./pages/MorningCheckinPage";
import SessionLogPage from "./pages/SessionLogPage";

// Layout wrapper for authenticated app (bottom nav etc.)
import { AppShell } from "./components/layout/AppShell";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          {/* ---------- Public routes ---------- */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/landing" element={<Landing />} />

          {/* ---------- Authenticated app ---------- */}
          <Route element={<AuthGate />}>
            {/* AppShell wraps all in-app pages (Today, Log, Stats, Profile, etc.) */}
            <Route element={<AppShell />}>
              {/* Initial entry point after login/auth check */}
              <Route path="/" element={<Index />} />

              {/* Today = Morning Check-in */}
              <Route path="/today" element={<MorningCheckinPage />} />

              {/* Log = Session log */}
              <Route path="/log" element={<SessionLogPage />} />

              {/* Legacy diary alias -> Morning Check-in */}
              <Route path="/diary" element={<MorningCheckinPage />} />

              {/* Stats */}
              <Route path="/stats" element={<Stats />} />
              <Route path="/stats/trend" element={<StatsTrendPage />} />

              {/* Profile / setup */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />

              {/* Notes archive */}
              <Route path="/notes" element={<NotesArchivePage />} />
            </Route>
          </Route>

          {/* ---------- Catch-all ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
