"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Logo from "@/images/logo2.png";

interface PlazenLogoProps {
  width?: number;
  height?: number;
  className?: string;
  theme?: string; // Accept theme as a prop
}

export const PlazenLogo: React.FC<PlazenLogoProps> = ({
  width = 70,
  height = 70,
  className = "",
  theme,
}) => {
  const [shouldInvert, setShouldInvert] = useState(false);

  useEffect(() => {
    if (theme) {
      setShouldInvert(theme === "light");
    } else {
      // Check if light class is on document
      const checkTheme = () => {
        if (typeof document !== "undefined") {
          setShouldInvert(document.documentElement.classList.contains("light"));
        }
      };

      checkTheme();

      // Watch for theme changes
      const observer = new MutationObserver(checkTheme);
      if (typeof document !== "undefined") {
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }

      return () => observer.disconnect();
    }
  }, [theme]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src={Logo}
        alt="Plazen Logo"
        width={width}
        height={height}
        priority
        className={`transition-all duration-300 ease-in-out ${
          shouldInvert ? "invert" : ""
        }`}
        style={{
          filter: shouldInvert ? "invert(1)" : "none",
        }}
      />
    </div>
  );
};
