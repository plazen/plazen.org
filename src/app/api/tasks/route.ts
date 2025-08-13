import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    const whereClause: {
      user_id: string;
      scheduled_time?: { gte: Date; lt: Date };
    } = {
      user_id: session.user.id,
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      whereClause.scheduled_time = {
        gte: startDate,
        lt: endDate,
      };
    }

    const tasks = await prisma.tasks.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
    });

    const serializableTasks = tasks.map((task) => ({
      ...task,
      id: task.id.toString(),
    }));

    return NextResponse.json(serializableTasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

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

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let scheduledTime = body.scheduled_time
      ? new Date(body.scheduled_time)
      : null;

    if (!body.is_time_sensitive) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { user_id: session.user.id },
      });

      const timetableStartHour = userSettings?.timetable_start ?? 8;
      const timetableEndHour = userSettings?.timetable_end ?? 18;

      const existingTasks = await prisma.tasks.findMany({
        where: {
          user_id: session.user.id,
          scheduled_time: { not: null },
        },
        orderBy: { scheduled_time: "asc" },
      });

      const now = body.user_current_time
        ? new Date(body.user_current_time)
        : new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let timetableStart = new Date(today);
      timetableStart.setHours(timetableStartHour, 0, 0, 0);

      const timetableEnd = new Date(today);
      timetableEnd.setHours(timetableEndHour, 0, 0, 0);

      if (now > timetableStart) {
        timetableStart = now;
      }

      const occupiedSlots = existingTasks.map((task) => {
        const start = new Date(task.scheduled_time!);
        const end = new Date(
          start.getTime() + (task.duration_minutes || 60) * 60000
        );
        return { start, end };
      });

      const freeSlots: { start: Date; end: Date }[] = [];
      let lastEventEnd = timetableStart;

      occupiedSlots.forEach((slot) => {
        if (slot.start > lastEventEnd) {
          freeSlots.push({ start: lastEventEnd, end: slot.start });
        }
        lastEventEnd = new Date(
          Math.max(lastEventEnd.getTime(), slot.end.getTime())
        );
      });

      if (lastEventEnd < timetableEnd) {
        freeSlots.push({ start: lastEventEnd, end: timetableEnd });
      }

      const taskDuration = body.duration_minutes || 60;
      const availableSlots = freeSlots.filter(
        (slot) =>
          (slot.end.getTime() - slot.start.getTime()) / 60000 >= taskDuration
      );

      if (availableSlots.length > 0) {
        const randomSlot =
          availableSlots[Math.floor(Math.random() * availableSlots.length)];
        const maxStartTime = randomSlot.end.getTime() - taskDuration * 60000;

        if (maxStartTime > randomSlot.start.getTime()) {
          const randomStartTimeMillis =
            randomSlot.start.getTime() +
            Math.random() * (maxStartTime - randomSlot.start.getTime());

          const randomDate = new Date(randomStartTimeMillis);
          const minutes = randomDate.getMinutes();
          const roundedMinutes = Math.round(minutes / 15) * 15;

          randomDate.setSeconds(0, 0);
          randomDate.setMinutes(roundedMinutes);

          if (roundedMinutes >= 60) {
            randomDate.setHours(randomDate.getHours() + 1, 0);
          }

          const endTime = new Date(randomDate.getTime() + taskDuration * 60000);
          if (endTime <= randomSlot.end) {
            scheduledTime = randomDate;
          }
        }
      }
    }

    const newTask = await prisma.tasks.create({
      data: {
        user_id: session.user.id,
        title: body.title,
        duration_minutes: body.duration_minutes || 60,
        is_time_sensitive: body.is_time_sensitive,
        scheduled_time: scheduledTime,
        is_completed: false,
      },
    });

    const serializableNewTask = {
      ...newTask,
      id: newTask.id.toString(),
    };

    return NextResponse.json(serializableNewTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    const body = await request.json();
    const { id, is_completed, scheduled_time } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const dataToUpdate: {
      is_completed?: boolean;
      scheduled_time?: Date;
      is_time_sensitive?: boolean;
    } = {};

    if (typeof is_completed === "boolean") {
      dataToUpdate.is_completed = is_completed;
    }

    if (scheduled_time) {
      dataToUpdate.scheduled_time = new Date(scheduled_time);
      dataToUpdate.is_time_sensitive = true;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.tasks.update({
      where: {
        id: BigInt(id),
        user_id: session.user.id,
      },
      data: dataToUpdate,
    });

    const serializableUpdatedTask = {
      ...updatedTask,
      id: updatedTask.id.toString(),
    };

    return NextResponse.json(serializableUpdatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    await prisma.tasks.delete({
      where: {
        id: BigInt(id),
        user_id: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
