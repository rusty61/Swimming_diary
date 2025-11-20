// src/components/layout/BottomNav.tsx
"use client";

import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/today", label: "Today" },
  { to: "/log", label: "Log" },
  { to: "/stats", label: "Stats" },
  { to: "/profile", label: "Profile" },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex flex-1 flex-col items-center gap-1 text-xs py-1",
                "transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
