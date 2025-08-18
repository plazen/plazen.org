"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/app/components/ui/button";
import { themes, Theme } from "@/lib/theme";

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ThemeToggle({
  showLabel = false,
  variant = "outline",
  size = "default",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themeOrder: Theme[] = ["light", "dark", "system"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={cycleTheme}
      className="flex items-center gap-2"
    >
      {getIcon()}
      {showLabel && (
        <span className="hidden sm:inline">{themes[theme].name}</span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
