"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      // Check if profile exists, if not, redirect to profile setup
      const checkProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("Index: Error fetching profile:", error);
          showError(`Error checking profile: ${error.message}`);
          navigate("/profile-setup");
          return;
        }

        if (!data) {
          console.log("Index: No profile found, redirecting to /profile-setup");
          navigate("/profile-setup");
        } else {
          console.log("Index: Profile found, redirecting to /landing");
          navigate("/landing"); // Redirect to the new Landing page
        }
      };
      checkProfile();
    } else {
      console.log("Index: User is null, redirecting to /login");
      navigate("/login"); // Redirect to the Login page if not authenticated
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-accent">
          {loading ? "Loading..." : "Redirecting..."}
        </h1>
        <p className="text-xl text-text-muted">
          {loading ? "Checking your authentication status." : "Determining your destination."}
        </p>
      </div>
    </div>
  );
};

export default Index;