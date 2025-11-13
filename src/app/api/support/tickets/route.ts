import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json();
  const { title, message, priority } = json;

  const ticket = await prisma.support_tickets.create({
    data: {
      user_id: session.user.id,
      title,
      priority: priority || "normal",
      messages: {
        create: {
          user_id: session.user.id,
          message: message,
        },
      },
    },
  });

  return NextResponse.json(ticket);
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

  const tickets = await prisma.support_tickets.findMany({
    where: isAdmin ? {} : { user_id: session.user.id },
    include: {
      labels: { include: { label: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  return NextResponse.json(tickets);
}
