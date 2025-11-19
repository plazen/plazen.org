"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function AdminPage({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/is_admin");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data);
        }
      } catch (error) {
        console.error("Failed to check admin status", error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingSpinner
          size="lg"
          text="Checking permissions..."
          variant="dots"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return redirect("/login");
  }

  return <>{children}</>;
}
