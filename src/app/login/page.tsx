"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/schedule");
      }
      setSession(data.session);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push("/schedule");
      }
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <PlazenLogo />
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={["github"]}
            redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`}
          />
        </div>
      </div>
    </div>
  );
}
