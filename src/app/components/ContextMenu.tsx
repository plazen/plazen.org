"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type MenuOption = {
  label: string;
  onClick: () => void;
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

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.1 }}
      className="fixed z-10 w-48 bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      style={{ top: y, left: x }}
    >
      <div className="py-1">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              option.onClick();
              onClose();
            }}
            className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default ContextMenu;
