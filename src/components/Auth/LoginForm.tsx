import React, { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import MotivationBoostCard from "@/components/MotivationBoostCard";

type Mode = "signin" | "signup";

export const LoginForm: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setAuthError(null);
    setSubmitting(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAuthError("Email and password are required.");
      setSubmitting(false);
      return;
    }

    let result;
    if (mode === "signin") {
      result = await signIn(trimmedEmail, trimmedPassword);
      if (result.error) {
        setAuthError(result.error);
      } else {
        setMessage("Signed in successfully.");
        navigate("/");
      }
    } else {
      result = await signUp(trimmedEmail, trimmedPassword);
      if (result.error) {
        setAuthError(result.error);
      } else {
        setMessage("Signed up. Check your email if confirmation is required.");
        navigate("/");
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="auth-page flex flex-col justify-center items-center p-4 w-full">
      {/* Card: make it full-width on mobile, sensible max width on desktop */}
      <Card className="auth-card mb-8 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-accent">
            {mode === "signin" ? "Log in" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-text-muted mt-2">
            {mode === "signin"
              ? "Welcome back! Please sign in to continue."
              : "Join us! Create your account to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="w-full">
              <label
                htmlFor="email"
                className="block mb-2 font-medium text-text-main"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || loading}
                // keep auth-input but FORCE sizing on top
                className="auth-input w-full h-14 rounded-full px-6 text-lg"
              />
            </div>

            {/* Password */}
            <div className="w-full">
              <label
                htmlFor="password"
                className="block mb-2 font-medium text-text-main"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting || loading}
                className="auth-input w-full h-14 rounded-full px-6 text-lg"
              />
            </div>

            {(authError || message) && (
              <div className="mb-3 text-sm text-center">
                {authError && <div className="text-destructive">{authError}</div>}
                {message && <div className="text-accent-soft">{message}</div>}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || loading}
              // keep your class, but force full width + height
              className="auth-button-primary w-full h-14 rounded-full text-lg font-semibold"
            >
              {submitting || loading
                ? "Working…"
                : mode === "signin"
                ? "Log in"
                : "Sign up"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-text-muted text-center">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => setMode("signup")}
                  disabled={submitting || loading}
                  className="auth-link p-0 h-auto"
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  onClick={() => setMode("signin")}
                  disabled={submitting || loading}
                  className="auth-link p-0 h-auto"
                >
                  Log in
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-md">
        <MotivationBoostCard />
      </div>
    </div>
  );
};
export default LoginForm;
