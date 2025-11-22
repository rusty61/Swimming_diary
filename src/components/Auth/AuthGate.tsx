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

    if (!user && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-accent">Checking session…</h1>
          <p className="text-xl text-text-muted">Verifying your authentication status.</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : null;
};

export default AuthGate;
