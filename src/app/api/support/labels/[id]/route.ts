import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { SupabaseClient } from "@supabase/supabase-js";

async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;
  return session.user.email === process.env.ADMIN_EMAIL;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { labelId } = await request.json();
  if (!labelId) {
    return NextResponse.json(
      { error: "Label ID is required" },
      { status: 400 }
    );
  }

  const result = await prisma.support_tickets_labels.create({
    data: {
      ticket_id: ticketId,
      label_id: labelId,
    },
  });

  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return NextResponse.json(
      { error: "Label ID is required in query params" },
      { status: 400 }
    );
  }

  await prisma.support_tickets_labels.delete({
    where: {
      ticket_id_label_id: {
        ticket_id: ticketId,
        label_id: labelId,
      },
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
