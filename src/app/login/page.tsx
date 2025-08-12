"use client"; // This component needs to be a client component to use hooks.

import { createBrowserClient } from "@supabase/ssr";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

// --- Helper Component: Plazen Logo ---
const PlazenLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M3 12C5.66667 8 7.33333 8 10 12C12.6667 16 14.3333 16 17 12C19.6667 8 21 8 21 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="10" r="1.5" fill="currentColor" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    <circle cx="18" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

export default function LoginPage() {
  // --- State and Client Initialization ---
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- Authentication Logic ---
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  // --- Handlers ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <PlazenLogo />
        </div>

        {session ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              You are logged in!
            </h2>
            <p className="text-gray-400 mb-6">Welcome, {session.user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              theme="dark"
              providers={["github"]}
              redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
