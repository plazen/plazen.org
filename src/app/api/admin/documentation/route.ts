import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await prisma.documentation_entries.findMany({
      orderBy: {
        topic: "asc",
      },
    });
    return NextResponse.json(entries);
  } catch (error: unknown) {
    console.error("Error fetching documentation entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch documentation entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { topic, text, category } = body;

    if (!topic || !text) {
      return NextResponse.json(
        { error: "Topic and text are required" },
        { status: 400 }
      );
    }

    const newEntry = await prisma.documentation_entries.create({
      data: {
        topic,
        text,
        category: category || null,
      },
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating documentation entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
