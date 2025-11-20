// src/components/layout/AppShell.tsx
"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

/**
 * AppShell
 * Layout wrapper for all authenticated in-app pages.
 * Used as a layout <Route element={<AppShell />}> with nested child routes.
 */
export const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1 pb-16 px-3 pt-3 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
