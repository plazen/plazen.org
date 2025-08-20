import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  shouldGenerateRoutineTasksForToday,
  autoGenerateRoutineTasksForToday,
} from "@/lib/routineTasksService";

export const dynamic = "force-dynamic";

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
  const timezoneOffset = parseInt(searchParams.get("timezoneOffset") || "0");

  console.log("🔍 API GET /api/tasks - Requested date:", date);

  try {
    let rangeStart = new Date();
    let rangeEnd = new Date();

    if (date) {
      // If a specific date is requested, expand range to include that date
      const requestedDate = new Date(date);
      const today = new Date();

      // Set range to cover from 3 days before today to 4 days after today,
      // but expand to include the requested date if it's outside this range
      rangeStart.setDate(today.getDate() - 3);
      rangeEnd.setDate(today.getDate() + 4);

      // Expand range if requested date is outside
      if (requestedDate < rangeStart) {
        rangeStart = new Date(requestedDate);
      }
      if (requestedDate > rangeEnd) {
        rangeEnd = new Date(requestedDate);
        rangeEnd.setDate(rangeEnd.getDate() + 1); // Include the full day
      }
    } else {
      // Default range: 3 days ago to 4 days from now
      rangeStart.setDate(rangeStart.getDate() - 3);
      rangeEnd.setDate(rangeEnd.getDate() + 4);
    }

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    // Auto-generate routine tasks for the specific date if it's requested and needed
    if (date) {
      const shouldGenerate = await shouldGenerateRoutineTasksForToday(
        session.user.id,
        date,
        timezoneOffset
      );
      if (shouldGenerate) {
        console.log("🔄 Auto-generating routine tasks for date:", date);
        const generatedTasks = await autoGenerateRoutineTasksForToday(
          session.user.id,
          date,
          timezoneOffset
        );
        console.log(`🔄 Generated ${generatedTasks.length} routine tasks`);
      }
    }

    const tasks = await prisma.tasks.findMany({
      where: {
        user_id: session.user.id,
        scheduled_time: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      orderBy: { created_at: "asc" },
    });

    console.log(
      "📊 API GET /api/tasks - Total tasks found in range:",
      tasks.length
    );
    console.log(
      "📅 API GET /api/tasks - Date range:",
      rangeStart.toISOString(),
      "to",
      rangeEnd.toISOString()
    );
    if (date) {
      console.log("🎯 API GET /api/tasks - Requested date:", date);
    }

    let filteredTasks = tasks;
    if (date) {
      console.log("🎯 API GET /api/tasks - Filtering by date:", date);
      filteredTasks = tasks.filter((task) => {
        if (!task.scheduled_time) return false;

        // Extract the date part directly from the ISO string to avoid timezone conversion
        const taskDateTime = task.scheduled_time as Date;
        const isoString = taskDateTime.toISOString();

        // Extract date part from ISO string (YYYY-MM-DD)
        const taskDateString = isoString.split("T")[0];

        console.log(
          `📝 Task "${task.title}" - scheduled_time:`,
          taskDateTime,
          "-> date string:",
          taskDateString,
          "matches:",
          taskDateString === date
        );

        return taskDateString === date;
      });
      console.log(
        "✅ API GET /api/tasks - Filtered tasks count:",
        filteredTasks.length
      );
    }

    // Convert all scheduled_time fields back to fake ISO format
    const serializableTasks = filteredTasks.map((task) => ({
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

    let scheduledTime = null;
    if (body.scheduled_time) {
      // Keep as string and format as fake ISO to prevent timezone conversion
      let iso = body.scheduled_time;
      // If input is 'YYYY-MM-DDTHH:mm:ss', add '.000Z'
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) {
        iso = iso + ".000Z";
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)) {
        iso = iso + ":00.000Z";
      }
      scheduledTime = iso;
    }

    if (!body.is_time_sensitive) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { user_id: session.user.id },
      });

      const timetableStartHour = userSettings?.timetable_start ?? 8;
      const timetableEndHour = userSettings?.timetable_end ?? 18;

      const scheduleDay = new Date(body.for_date);

      const timetableStart = new Date(scheduleDay);
      timetableStart.setHours(timetableStartHour, 0, 0, 0);

      const timetableEnd = new Date(scheduleDay);
      timetableEnd.setHours(timetableEndHour, 0, 0, 0);

      const existingTasks = await prisma.tasks.findMany({
        where: {
          user_id: session.user.id,
          scheduled_time: {
            gte: timetableStart,
            lt: timetableEnd,
          },
        },
        orderBy: { scheduled_time: "asc" },
      });

      function parseLocalDateTimeArr(
        str: string
      ): [number, number, number, number, number, number] {
        const [datePart, timePart] = str.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);
        return [year, month, day, hour, minute, second];
      }
      function toMinutes(
        arr: [number, number, number, number, number, number]
      ): number {
        return arr[3] * 60 + arr[4] + arr[5] / 60;
      }
      function compareDateTimeArr(
        a: [number, number, number, number, number, number],
        b: [number, number, number, number, number, number]
      ): number {
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return a[i] - b[i];
        }
        return 0;
      }

      const occupiedSlots: {
        start: [number, number, number, number, number, number];
        end: [number, number, number, number, number, number];
      }[] = existingTasks
        .filter((task) => task.scheduled_time)
        .map((task) => {
          // Use the original scheduled_time string parsing
          const iso = (task.scheduled_time as Date)
            .toISOString()
            .replace(/\..*$/, "")
            .replace("Z", "");
          const arr = parseLocalDateTimeArr(iso) as [
            number,
            number,
            number,
            number,
            number,
            number
          ];
          const duration = task.duration_minutes || 60;
          const endArr: [number, number, number, number, number, number] = [
            ...arr,
          ];
          endArr[4] += duration; // add minutes
          while (endArr[4] >= 60) {
            endArr[3] += 1;
            endArr[4] -= 60;
          }
          return { start: arr, end: endArr };
        });

      const freeSlots: {
        start: [number, number, number, number, number, number];
        end: [number, number, number, number, number, number];
      }[] = [];
      // timetableStart is a Date, convert to [y,m,d,h,m,s]
      let lastEventEnd: [number, number, number, number, number, number] = [
        timetableStart.getFullYear(),
        timetableStart.getMonth() + 1,
        timetableStart.getDate(),
        timetableStart.getHours(),
        timetableStart.getMinutes(),
        timetableStart.getSeconds(),
      ];
      if (body.is_for_today && body.user_current_time) {
        const userCurrentArr = parseLocalDateTimeArr(
          body.user_current_time
        ) as [number, number, number, number, number, number];
        if (compareDateTimeArr(userCurrentArr, lastEventEnd) > 0) {
          lastEventEnd = userCurrentArr;
        }
      }

      occupiedSlots.forEach((slot) => {
        if (compareDateTimeArr(slot.start, lastEventEnd) > 0) {
          freeSlots.push({ start: lastEventEnd, end: slot.start });
        }
        // max of lastEventEnd and slot.end
        lastEventEnd =
          compareDateTimeArr(lastEventEnd, slot.end) > 0
            ? lastEventEnd
            : slot.end;
      });

      // timetableEnd is a Date, convert to [y,m,d,h,m,s]
      const timetableEndArr: [number, number, number, number, number, number] =
        [
          timetableEnd.getFullYear(),
          timetableEnd.getMonth() + 1,
          timetableEnd.getDate(),
          timetableEnd.getHours(),
          timetableEnd.getMinutes(),
          timetableEnd.getSeconds(),
        ];
      if (compareDateTimeArr(lastEventEnd, timetableEndArr) < 0) {
        freeSlots.push({ start: lastEventEnd, end: timetableEndArr });
      }

      const taskDuration = body.duration_minutes || 60;
      let availableSlots = freeSlots.filter(
        (slot) =>
          toMinutes(
            slot.end as [number, number, number, number, number, number]
          ) -
            toMinutes(
              slot.start as [number, number, number, number, number, number]
            ) >=
          taskDuration
      );
      if (body.is_for_today && body.user_current_time) {
        const nowArr = parseLocalDateTimeArr(body.user_current_time) as [
          number,
          number,
          number,
          number,
          number,
          number
        ];
        availableSlots = availableSlots.filter(
          (slot) =>
            compareDateTimeArr(
              slot.end as [number, number, number, number, number, number],
              nowArr
            ) > 0
        );
      }

      if (availableSlots.length > 0) {
        const randomSlot =
          availableSlots[Math.floor(Math.random() * availableSlots.length)];
        let minStart: [number, number, number, number, number, number] =
          randomSlot.start as [number, number, number, number, number, number];
        if (body.is_for_today && body.user_current_time) {
          const nowArr = parseLocalDateTimeArr(body.user_current_time) as [
            number,
            number,
            number,
            number,
            number,
            number
          ];
          if (compareDateTimeArr(nowArr, minStart) > 0) minStart = nowArr;
        }
        const maxStartMinutes =
          toMinutes(
            randomSlot.end as [number, number, number, number, number, number]
          ) - taskDuration;
        const minStartMinutes = toMinutes(minStart);

        if (maxStartMinutes > minStartMinutes) {
          // Generate all possible 15-min aligned start times in the slot
          const possibleStarts: [
            number,
            number,
            number,
            number,
            number,
            number
          ][] = [];
          for (
            let mins = Math.ceil(minStartMinutes / 15) * 15;
            mins <= maxStartMinutes;
            mins += 15
          ) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const s = 0;
            const startArr: [number, number, number, number, number, number] = [
              ...minStart,
            ];
            startArr[3] = h;
            startArr[4] = m;
            startArr[5] = s;
            // Check for overlap with occupiedSlots (strict interval intersection)
            const startMins = mins;
            const endMins = startMins + taskDuration;
            let overlaps = false;
            for (const occ of occupiedSlots) {
              const occStartMins = toMinutes(occ.start);
              const occEndMins = toMinutes(occ.end);
              if (
                (startMins < occEndMins && endMins > occStartMins) ||
                startMins === occStartMins
              ) {
                overlaps = true;
                break;
              }
            }
            if (!overlaps) possibleStarts.push(startArr);
          }
          if (possibleStarts.length > 0) {
            const chosen =
              possibleStarts[Math.floor(Math.random() * possibleStarts.length)];
            scheduledTime = `${chosen[0]}-${String(chosen[1]).padStart(
              2,
              "0"
            )}-${String(chosen[2]).padStart(2, "0")}T${String(
              chosen[3]
            ).padStart(2, "0")}:${String(chosen[4]).padStart(2, "0")}:${String(
              chosen[5]
            ).padStart(2, "0")}.000Z`;
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
    const { id, is_completed, scheduled_time, title } = body;

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
      title?: string;
    } = {};

    if (typeof is_completed === "boolean") {
      dataToUpdate.is_completed = is_completed;
    }

    if (title && typeof title === "string") {
      dataToUpdate.title = title.trim();
    }

    if (scheduled_time) {
      // Format as fake ISO string: YYYY-MM-DDTHH:mm:ss.000Z (do not shift time)
      let iso = scheduled_time;
      // If input is 'YYYY-MM-DDTHH:mm', add ':00.000Z'
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)) {
        iso = iso + ":00.000Z";
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) {
        iso = iso + ".000Z";
      }
      dataToUpdate.scheduled_time = iso;
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
