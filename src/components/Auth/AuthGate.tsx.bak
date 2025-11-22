import React, { useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

export const AuthGate: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If not authenticated, redirect to login, unless already on login or landing
        if (location.pathname !== "/login" && location.pathname !== "/landing") {
          navigate("/login", { replace: true });
        }
      } else {
        // If authenticated, and on login or landing, redirect to root
        if (location.pathname === "/login" || location.pathname === "/landing") {
          navigate("/", { replace: true });
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

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

  // If user is authenticated, render the nested routes.
  if (user) {
    return <Outlet />;
  }

  // If not authenticated and not loading, and we are on a protected route,
  // the useEffect above should have already redirected to /login.
  // If we are on /login or /landing, this AuthGate component should not be active
  // because those routes are defined outside its <Route element={...}>.
  // Returning null here allows the router to continue processing,
  // and the useEffect should eventually redirect or the public route will render.
  return null;
};