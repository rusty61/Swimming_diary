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

import Stats from "./pages/Stats"; // Full stats page (heavy dashboard)
import StatsTrendPage from "./pages/StatsTrendPage"; // Graph-only page
import Profile from "./pages/Profile"; // Edit profile
import NotesArchivePage from "./pages/NotesArchivePage"; // Notes archive

import MorningCheckinPage from "./pages/MorningCheckinPage";
import SessionLogPage from "./pages/SessionLogPage";
import SavedEntriesPage from "./pages/SavedEntriesPage"; // NEW
import StatsGalleryPage from "./pages/StatsGalleryPage"; // Gallery

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
            {/* AppShell wraps all in-app pages (bottom nav, etc.) */}
            <Route element={<AppShell />}>
              {/* Initial entry point after login/auth check */}
              <Route path="/" element={<Index />} />

              {/* Today = Morning Check-in */}
              <Route path="/today" element={<MorningCheckinPage />} />

              {/* Log = Session log + history */}
              <Route path="/log" element={<SessionLogPage />} />
              <Route path="/log/history" element={<SavedEntriesPage />} />

              {/* Legacy diary alias -> Morning Check-in */}
              <Route path="/diary" element={<MorningCheckinPage />} />

              {/* Stats: light gallery first, then deeper pages */}
              <Route path="/stats" element={<StatsGalleryPage />} />
              <Route path="/stats/trend" element={<StatsTrendPage />} />
              <Route path="/stats/full" element={<Stats />} />

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
