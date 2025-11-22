"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";
import MotivationBoostCard from "@/components/MotivationBoostCard";

const formSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select your gender." }),
  dateOfBirth: z.date({ required_error: "A date of birth is required." }),
  height: z.number().min(50, { message: "Height must be at least 50 cm." }).max(250, { message: "Height cannot exceed 250 cm." }),
  weight: z.number().min(20, { message: "Weight must be at least 20 kg." }).max(300, { message: "Weight cannot exceed 300 kg." }),
  lastPeriodStartDate: z.date().optional(),
});

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: user?.email || "",
      gender: "Male",
      height: 170,
      weight: 70,
      dateOfBirth: new Date(),
      lastPeriodStartDate: undefined,
    },
  });

  useEffect(() => {
    if (!user) return;

    form.setValue("email", user.email || "");
    form.clearErrors("email");

    const fetchProfile = async () => {
      // 1) Pull DB profile (source of truth)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, gender, date_of_birth, height, weight, last_period_start_date")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
        showError(`Failed to load profile: ${profileError.message}`);
        return;
      }

      // 2) Fallback to auth metadata if DB fields missing (smooth migration)
      const { data: userData } = await supabase.auth.getUser();
      const md = userData?.user?.user_metadata || {};

      if (profileData) {
        form.setValue("username", profileData.first_name || "");

        form.setValue("gender", (profileData.gender || md.gender || "Male") as any);
        form.setValue("height", profileData.height ?? md.height ?? 170);
        form.setValue("weight", profileData.weight ?? md.weight ?? 70);

        const dobStr = profileData.date_of_birth || md.date_of_birth;
        if (dobStr) {
          const dob = parseISO(dobStr);
          if (isValid(dob)) form.setValue("dateOfBirth", dob);
        }

        const lpStr = profileData.last_period_start_date || md.last_period_start_date;
        if (lpStr) {
          const lp = parseISO(lpStr);
          if (isValid(lp)) form.setValue("lastPeriodStartDate", lp);
        }
      }
    };

    fetchProfile();
  }, [user, form]);

  const gender = form.watch("gender");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("User not authenticated. Please log in first.");
      navigate("/login");
      return;
    }

    try {
      const payload = {
        id: user.id,
        first_name: values.username,
        gender: values.gender,
        date_of_birth: format(values.dateOfBirth, "yyyy-MM-dd"),
        height: values.height,
        weight: values.weight,
        last_period_start_date: values.lastPeriodStartDate
          ? format(values.lastPeriodStartDate, "yyyy-MM-dd")
          : null,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("Supabase profile upsert error:", error);
        throw new Error(`Failed to update profile in database: ${error.message}`);
      }

      showSuccess("Profile updated successfully!");
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating the profile.";
      showError(`Error updating profile: ${message}`);
      console.error("Profile update error caught:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-accent">Loading.</h1>
          <p className="text-xl text-text-muted">Checking authentication status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-lg bg-card text-foreground border-card-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-accent">Edit Profile</CardTitle>
          <CardDescription className="text-text-muted mt-2">
            Update your personal details.
          </CardDescription>
        </CardHeader>

        <CardContent className="bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg text-text-main">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your username"
                        {...field}
                        className="bg-input text-foreground border-border"
                      />
                    </FormControl>
                    <FormDescription className="text-text-muted">
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg text-text-main">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@example.com"
                        {...field}
                        disabled
                        className="bg-input text-foreground border-border"
                      />
                    </FormControl>
                    <FormDescription className="text-text-muted">
                      Your email address (cannot be changed here).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg text-text-main">Gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-input text-foreground border-border">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-popover-foreground border-border">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-text-muted">
                      This helps us tailor your training plan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg text-text-main">Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal bg-input text-foreground border-border",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-white text-gray-900 border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          className="calendar-red-dates"
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-text-muted">
                      Your date of birth.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg text-text-main">Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 175"
                        className="w-32 bg-input text-foreground border-border"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-text-muted">
                      Your height in centimeters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg text-text-main">Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 70"
                        className="w-32 bg-input text-foreground border-border"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-text-muted">
                      Your weight in kilograms.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {gender === "Female" && (
                <FormField
                  control={form.control}
                  name="lastPeriodStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-lg text-text-main">Last Period Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal bg-input text-foreground border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0 bg-white text-gray-900 border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            className="calendar-red-dates"
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-text-muted">
                        Your last menstrual period start date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-accent-strong text-primary-foreground text-lg py-2 rounded-md"
              >
                Update Profile
              </Button>

            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="w-full max-w-2xl mt-8">
        <MotivationBoostCard />
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default Profile;
