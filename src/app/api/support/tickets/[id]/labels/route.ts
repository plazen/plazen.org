import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
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

  // Only admins can manage labels
  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const { labelId } = json;

  if (!labelId) {
    return NextResponse.json(
      { error: "Label ID is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.support_tickets_labels.create({
      data: {
        ticket_id: id,
        label_id: labelId,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to add label", errorDetail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!labelId) {
    return NextResponse.json(
      { error: "Label ID is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.support_tickets_labels.delete({
      where: {
        ticket_id_label_id: {
          ticket_id: id,
          label_id: labelId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to remove label",
        errorDetail: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
