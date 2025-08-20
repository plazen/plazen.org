import prisma from "./prisma";

export interface RoutineTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GeneratedTask {
  id: bigint;
  user_id: string;
  title: string;
  duration_minutes: number | null;
  is_time_sensitive: boolean;
  scheduled_time: Date | null;
  is_completed: boolean;
  created_at: Date;
}

/**
 * Check if routine tasks should be generated for the given date
 * Only generates for "today" based on user's timezone
 */
export async function shouldGenerateRoutineTasksForToday(
  userId: string,
  dateString: string,
  timezoneOffset: number
): Promise<boolean> {
  // Calculate user's current date based on timezone offset
  const now = new Date();
  const userTime = new Date(now.getTime() - timezoneOffset * 60000);
  const userDateString = userTime.toISOString().split("T")[0];

  // Only generate for today
  if (dateString !== userDateString) {
    return false;
  }

  // Check if routine tasks have already been generated for this specific date
  // We'll check if any tasks are scheduled for the requested date with the routine pattern
  const requestedDateStart = new Date(dateString + "T00:00:00.000Z");
  const requestedDateEnd = new Date(dateString + "T23:59:59.999Z");

  const existingGeneratedTasks = await prisma.tasks.findFirst({
    where: {
      user_id: userId,
      scheduled_time: {
        gte: requestedDateStart,
        lte: requestedDateEnd,
      },
      title: {
        contains: "[Routine]",
      },
    },
  });

  return !existingGeneratedTasks;
}

/**
 * Automatically generate routine tasks for today
 */
export async function autoGenerateRoutineTasksForToday(
  userId: string,
  dateString: string,
  timezoneOffset: number
): Promise<GeneratedTask[]> {
  const shouldGenerate = await shouldGenerateRoutineTasksForToday(
    userId,
    dateString,
    timezoneOffset
  );

  if (!shouldGenerate) {
    return [];
  }

  // Get user's timetable settings
  const userSettings = await prisma.userSettings.findFirst({
    where: {
      user_id: userId,
    },
  });

  // Default to 8 AM - 6 PM if no settings found
  const timetableStart = userSettings?.timetable_start || 8;
  const timetableEnd = userSettings?.timetable_end || 18;

  // Get user's active routine tasks
  const routineTasks = await prisma.routine_tasks.findMany({
    where: {
      user_id: userId,
      is_active: true,
    },
  });

  if (routineTasks.length === 0) {
    return [];
  }

  // Generate random times for routine tasks
  const generatedTasks: GeneratedTask[] = [];
  const usedTimeSlots: { start: number; end: number }[] = [];

  for (const routineTask of routineTasks) {
    const startTime = generateRandomTimeSlot(
      routineTask.duration_minutes,
      usedTimeSlots,
      timetableStart,
      timetableEnd
    );
    const endTime = startTime + routineTask.duration_minutes;

    // Add to used time slots to avoid overlap
    usedTimeSlots.push({ start: startTime, end: endTime });

    // Create scheduled time for the task
    const scheduledDateTime = new Date(dateString + "T00:00:00.000Z");
    scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + startTime);

    // Create the task in database
    const createdTask = await prisma.tasks.create({
      data: {
        user_id: userId,
        title: `[Routine] ${routineTask.title}`,
        duration_minutes: routineTask.duration_minutes,
        is_time_sensitive: true,
        scheduled_time: scheduledDateTime,
        is_completed: false,
      },
    });

    generatedTasks.push(createdTask);
  }

  return generatedTasks;
}

/**
 * Generate a random time slot that doesn't overlap with existing slots
 * Snaps to 15-minute intervals (:00, :15, :30, :45)
 */
function generateRandomTimeSlot(
  duration: number,
  usedTimeSlots: { start: number; end: number }[],
  timetableStartHour: number,
  timetableEndHour: number
): number {
  const dayStartMinutes = timetableStartHour * 60;
  const dayEndMinutes = timetableEndHour * 60;
  const maxAttempts = 100;

  // Function to snap time to 15-minute intervals
  const snapTo15Minutes = (minutes: number): number => {
    const remainder = minutes % 15;
    if (remainder === 0) return minutes;
    return minutes - remainder + (remainder > 7 ? 15 : 0);
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const latestStart = dayEndMinutes - duration;
    const randomStart = Math.floor(
      Math.random() * (latestStart - dayStartMinutes) + dayStartMinutes
    );

    // Snap to 15-minute interval
    const snappedStart = snapTo15Minutes(randomStart);

    // Make sure snapped time is still within bounds
    if (
      snappedStart < dayStartMinutes ||
      snappedStart + duration > dayEndMinutes
    ) {
      continue;
    }

    // Check for overlaps
    const hasOverlap = usedTimeSlots.some(
      (slot) =>
        !(snappedStart >= slot.end || snappedStart + duration <= slot.start)
    );

    if (!hasOverlap) {
      return snappedStart;
    }
  }

  // Fallback: return snapped start time
  return snapTo15Minutes(dayStartMinutes);
}

/**
 * Get all routine tasks for a user
 */
export async function getRoutineTasks(userId: string): Promise<RoutineTask[]> {
  return await prisma.routine_tasks.findMany({
    where: {
      user_id: userId,
      is_active: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

/**
 * Create a new routine task
 */
export async function createRoutineTask(
  userId: string,
  title: string,
  duration: number
): Promise<RoutineTask> {
  return await prisma.routine_tasks.create({
    data: {
      user_id: userId,
      title,
      duration_minutes: duration,
      is_active: true,
    },
  });
}

/**
 * Update a routine task
 */
export async function updateRoutineTask(
  id: string,
  userId: string,
  data: { title?: string; duration_minutes?: number; is_active?: boolean }
): Promise<RoutineTask | null> {
  return await prisma.routine_tasks.update({
    where: {
      id,
      user_id: userId,
    },
    data,
  });
}

/**
 * Delete a routine task
 */
export async function deleteRoutineTask(
  id: string,
  userId: string
): Promise<RoutineTask | null> {
  return await prisma.routine_tasks.delete({
    where: {
      id,
      user_id: userId,
    },
  });
}
