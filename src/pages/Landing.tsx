"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { MoodSelector, MoodValue } from "@/components/MoodSelector";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import MotivationBoostCard from "@/components/MotivationBoostCard";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user) {
      const checkProfileStatus = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Landing: Error fetching profile:", error);
          showError(`Error checking profile: ${error.message}`);
          setProfileComplete(false);
          return;
        }
        setProfileComplete(!!data);
        if (!data) {
          console.log("Landing: Profile not complete, redirecting to /profile-setup");
          navigate("/profile-setup");
        }
      };
      checkProfileStatus();
    } else if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const name = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "Athlete";
  const email = user?.email || "";
  const avatar = user?.user_metadata?.avatar_url || `https://robohash.org/${encodeURIComponent(email || name)}?set=set3`;

  const quickActions = [
    { label: "Morning check-in", helper: "Log mood + resting HR", to: "/today" },
    { label: "Log a session", helper: "Distance, pace, notes", to: "/session-log" },
    { label: "View stats", helper: "Trends & weekly totals", to: "/stats" },
    { label: "Saved entries", helper: "Browse past highlights", to: "/saved-entries" },
  ];

  const infoCards = [
    {
      title: "How it works",
      body: "Capture your morning check-in, add sessions after you swim, then review the weekly gallery to steer your training.",
      action: () => navigate("/how-it-works"),
      cta: "See tips",
    },
    {
      title: "Profile & settings",
      body: "Keep your goals, zones, and bio up to date so stats stay meaningful.",
      action: () => navigate("/profile"),
      cta: "Edit profile",
    },
  ];

  if (loading || !user || !profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-accent">Loading...</h1>
          <p className="text-xl text-text-muted">Preparing your experience.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="shell flex flex-col gap-8 p-4 pb-16">
      <section className="hero-landing" aria-labelledby="title">
        <div className="kicker-landing">
          <span className="rule-landing" />
          <span className="dot-landing" />
          <span className="rule-landing" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 id="title" className="heading-display leading-tight">
                <span className="text-[color:#3CB371]">Black Line</span> Journal
              </h1>
              <p className="sub-landing text-left lg:text-base">
                A fast lane to track mood, heart rate, and training load without endless scrolling. Start your check-in, log today’s swim, and jump into the stats gallery in just a tap.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <img
                src={avatar}
                alt="User avatar"
                className="w-14 h-14 rounded-full border border-[rgba(255,255,255,.15)] shadow-[0_10px_35px_rgba(0,0,0,.35)]"
              />
              <div>
                <div className="text-lg font-semibold">Welcome back, {name}</div>
                {email && <div className="text-sm text-[var(--text-muted)]">{email}</div>}
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <span className="pill-landing">Fresh week</span>
                <span className="pill-landing">Keep it light</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="card-landing mcard-landing">
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-lg">Today’s mood</h3>
                  <Button size="sm" variant="secondary" onClick={() => navigate("/today")}>Open check-in</Button>
                </div>
                <MoodSelector value={mood} onChange={setMood} />
                <p className="tiny-landing">Tap a mood to log it quickly; heart rate capture lives in the check-in page.</p>
              </article>

              <article className="card-landing mcard-landing">
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-lg">This week so far</h3>
                  <Button size="sm" variant="secondary" onClick={() => navigate("/stats-gallery")}>View gallery</Button>
                </div>
                <div className="space-y-3 text-sm text-[var(--text-muted)]">
                  <div className="flex justify-between items-center"><span>Sessions</span><strong className="text-white">—</strong></div>
                  <div className="flex justify-between items-center"><span>Distance</span><strong className="text-white">—</strong></div>
                  <div className="flex justify-between items-center"><span>Avg mood</span><strong className="text-white">{mood ?? "—"}</strong></div>
                </div>
                <p className="footnote-landing">Connect your store to show live totals and mood averages.</p>
              </article>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-landing">
              <h3 className="mb-1">Fast actions</h3>
              <p className="text-[var(--text-muted)] text-sm mb-4">Jump straight to the flow you need—no multi-select, no extra scroll.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    className="action-card"
                    onClick={() => navigate(item.to)}
                  >
                    <div className="text-base font-semibold">{item.label}</div>
                    <div className="text-sm text-[var(--text-muted)]">{item.helper}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {infoCards.map((info) => (
                <article key={info.title} className="card-landing mcard-landing flex flex-col gap-3">
                  <div>
                    <h3 className="m-0 text-lg">{info.title}</h3>
                    <p className="tiny-landing leading-relaxed">{info.body}</p>
                  </div>
                  <Button variant="secondary" onClick={info.action} className="w-fit">{info.cta}</Button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl">
        <MotivationBoostCard />
      </div>
    </main>
  );
};

export default Landing;
