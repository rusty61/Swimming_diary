// src/components/Auth/AuthGate.tsx
import React, { useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

export const AuthGate: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → send to /login for protected routes
    if (!user) {
      if (location.pathname !== "/login" && location.pathname !== "/landing") {
        navigate("/login", { replace: true });
      }
      return;
    }

    // Authenticated but sitting on login page → go to landing
    if (location.pathname === "/login") {
      navigate("/landing", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // While auth state is resolving, show a simple loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <h1 className="text-4xl font-bold mb-4 text-accent">Checking session…</h1>
      </div>
    );
  }

  // Authenticated → allow nested protected routes to render
  if (user) return <Outlet />;

  // Not authenticated → let public routes render (redirect handled in effect)
  return null;
};

export default AuthGate;
