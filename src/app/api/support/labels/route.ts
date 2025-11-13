import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SupabaseClient } from "@supabase/supabase-js";

async function isAdmin(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;
  return session.user.email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const labels = await prisma.support_labels.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, color } = await request.json();
  if (!name || !color) {
    return NextResponse.json(
      { error: "Name and color are required" },
      { status: 400 }
    );
  }

  try {
    const label = await prisma.support_labels.create({
      data: { name, color },
    });
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Label already exists or invalid data" },
      { status: 409 }
    );
  }
}
