import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, duration_minutes, is_active } = body;

    const dataToUpdate: {
      title?: string;
      description?: string | null;
      duration_minutes?: number;
      is_active?: boolean;
      updated_at?: Date;
    } = {
      updated_at: new Date(),
    };

    if (title !== undefined) {
      dataToUpdate.title = title;
    }

    if (description !== undefined) {
      dataToUpdate.description = description || null;
    }

    if (duration_minutes !== undefined) {
      dataToUpdate.duration_minutes = parseInt(duration_minutes);
    }

    if (is_active !== undefined) {
      dataToUpdate.is_active = is_active;
    }

    const updatedRoutineTask = await prisma.routine_tasks.update({
      where: {
        id,
        user_id: session.user.id,
      },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedRoutineTask, { status: 200 });
  } catch (error) {
    console.error("Error updating routine task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.routine_tasks.delete({
      where: {
        id,
        user_id: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Routine task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting routine task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
