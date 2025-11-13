import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const ticket = await prisma.support_tickets.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { created_at: "asc" },
        include: { user: { select: { email: true, id: true } } },
      },
      labels: { include: { label: true } },
      users: { select: { email: true } },
    },
  });

  if (!ticket)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access control
  if (!isAdmin && ticket.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Add a new message to the ticket
  const { id } = await params;
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
  const { message, status, is_internal } = json;

  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

  if (status) {
    await prisma.support_tickets.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }

  if (message) {
    await prisma.support_ticket_messages.create({
      data: {
        ticket_id: id,
        user_id: session.user.id,
        message,
        is_internal: isAdmin ? is_internal || false : false,
      },
    });

    await prisma.support_tickets.update({
      where: { id },
      data: { updated_at: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
