// src/components/Auth/LoginForm.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      showSuccess("Logged in");
    } catch (err: any) {
      showError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center px-4">
      <Card className="w-full max-w-md bg-black/50 border-white/10 backdrop-blur-md rounded-3xl shadow-xl">
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-bold text-green-400">Log in</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Welcome back! Please sign in to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* EMAIL */}
            <div className="space-y-2 w-full">
              <Label htmlFor="email" className="text-white text-lg">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full
                  h-14
                  rounded-full
                  bg-yellow-50/95
                  text-black
                  text-lg
                  px-6
                  border-0
                  focus-visible:ring-2
                  focus-visible:ring-green-400
                "
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2 w-full">
              <Label htmlFor="password" className="text-white text-lg">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  h-14
                  rounded-full
                  bg-yellow-50/95
                  text-black
                  text-lg
                  px-6
                  border-0
                  focus-visible:ring-2
                  focus-visible:ring-green-400
                "
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-14
                rounded-full
                text-lg
                font-semibold
                bg-green-500/80
                hover:bg-green-500
                text-black
                shadow-lg
              "
            >
              {loading ? "Logging in..." : "LOG IN"}
            </Button>

            <div className="text-center text-muted-foreground pt-2">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-green-400 hover:underline">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
