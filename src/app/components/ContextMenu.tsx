"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

type MenuOption = {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
};

type ContextMenuProps = {
  x: number;
  y: number;
  options: MenuOption[];
  onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  options,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Separate destructive options (like delete) from regular options
  const regularOptions = options.filter(
    (option) => option.variant !== "destructive"
  );
  const destructiveOptions = options.filter(
    (option) => option.variant === "destructive"
  );

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-50 min-w-48 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm overflow-hidden"
      style={{ top: y, left: x }}
    >
      {/* Regular options */}
      {regularOptions.length > 0 && (
        <div className="py-1">
          {regularOptions.map((option, index) => (
            <button
              key={`regular-${index}`}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors duration-150 focus:outline-none focus:bg-muted/70"
            >
              {option.icon && (
                <span className="text-muted-foreground">{option.icon}</span>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Separator if we have both regular and destructive options */}
      {regularOptions.length > 0 && destructiveOptions.length > 0 && (
        <div className="border-t border-border"></div>
      )}

      {/* Destructive options */}
      {destructiveOptions.length > 0 && (
        <div className="py-1">
          {destructiveOptions.map((option, index) => (
            <button
              key={`destructive-${index}`}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150 focus:outline-none focus:bg-destructive/20"
            >
              {option.icon || <Trash2 className="w-4 h-4" />}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ContextMenu;
