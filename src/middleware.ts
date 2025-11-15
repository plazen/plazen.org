import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "ADMIN") {
    console.log(
      "Unauthorized access attempt to admin area.",
      error,
      profile,
      profile?.role
    );
    return NextResponse.redirect(new URL("/schedule", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
