/**
 * Utility functions tests for timezone handling and time parsing
 */

// Test the parseLocal function that's used in Timetable component
describe("Time Parsing Utilities", () => {
  // Simulate the parseLocal function from Timetable component
  function parseLocal(dateString: string) {
    const clean = dateString.replace(/Z$/, "");
    const noMs = clean.replace(/\.\d{3}$/, "");
    const [datePart, timePart] = noMs.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second = 0] = timePart.split(":").map(Number);

    return {
      getHours: () => hour,
      getMinutes: () => minute,
      getTime: () => {
        return (
          ((year - 1970) * 365.25 * 24 * 60 * 60 +
            (month - 1) * 30.44 * 24 * 60 * 60 +
            (day - 1) * 24 * 60 * 60 +
            hour * 60 * 60 +
            minute * 60 +
            second) *
          1000
        );
      },
      toLocaleTimeString: () => {
        const paddedHour = String(hour).padStart(2, "0");
        const paddedMinute = String(minute).padStart(2, "0");
        return `${paddedHour}:${paddedMinute}`;
      },
    };
  }

  it("should parse ISO string correctly without timezone conversion", () => {
    const result = parseLocal("2025-08-19T15:30:00.000Z");

    expect(result.getHours()).toBe(15);
    expect(result.getMinutes()).toBe(30);
    expect(result.toLocaleTimeString()).toBe("15:30");
  });

  it("should handle ISO string without milliseconds", () => {
    const result = parseLocal("2025-08-19T09:15:00Z");

    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(15);
    expect(result.toLocaleTimeString()).toBe("09:15");
  });

  it("should handle ISO string without seconds", () => {
    const result = parseLocal("2025-08-19T14:45.000Z");

    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(45);
    expect(result.toLocaleTimeString()).toBe("14:45");
  });

  it("should handle edge case hours (midnight and noon)", () => {
    const midnight = parseLocal("2025-08-19T00:00:00.000Z");
    const noon = parseLocal("2025-08-19T12:00:00.000Z");

    expect(midnight.getHours()).toBe(0);
    expect(midnight.toLocaleTimeString()).toBe("00:00");

    expect(noon.getHours()).toBe(12);
    expect(noon.toLocaleTimeString()).toBe("12:00");
  });

  it("should handle late evening hours", () => {
    const lateEvening = parseLocal("2025-08-19T23:59:59.000Z");

    expect(lateEvening.getHours()).toBe(23);
    expect(lateEvening.getMinutes()).toBe(59);
    expect(lateEvening.toLocaleTimeString()).toBe("23:59");
  });
});

// Test timetable hour calculation logic
describe("Timetable Hour Calculations", () => {
  function calculateTotalHours(startHour: number, endHour: number): number {
    if (endHour > startHour) {
      return endHour - startHour;
    } else {
      return 24 - startHour + endHour;
    }
  }

  it("should calculate normal day hours correctly", () => {
    expect(calculateTotalHours(8, 18)).toBe(10); // 8am to 6pm = 10 hours
    expect(calculateTotalHours(9, 17)).toBe(8); // 9am to 5pm = 8 hours
  });

  it("should calculate cross-midnight hours correctly", () => {
    expect(calculateTotalHours(22, 6)).toBe(8); // 10pm to 6am = 8 hours
    expect(calculateTotalHours(20, 4)).toBe(8); // 8pm to 4am = 8 hours
  });

  it("should handle edge cases", () => {
    expect(calculateTotalHours(0, 12)).toBe(12); // midnight to noon
    expect(calculateTotalHours(12, 0)).toBe(12); // noon to midnight
    expect(calculateTotalHours(6, 6)).toBe(24); // same hour (24 hours later)
  });
});

// Test task positioning calculations
describe("Task Positioning Calculations", () => {
  function calculateTaskPosition(
    taskStartHour: number,
    timetableStartHour: number,
    totalHours: number
  ): number {
    const hoursFromStart = taskStartHour - timetableStartHour;
    return (hoursFromStart / totalHours) * 100;
  }

  function calculateTaskHeight(
    durationMinutes: number,
    totalHours: number
  ): number {
    return (durationMinutes / 60 / totalHours) * 100;
  }

  it("should calculate task position correctly", () => {
    // Task at 9am in 8am-6pm timetable (10 hours total)
    expect(calculateTaskPosition(9, 8, 10)).toBe(10); // 1 hour from start = 10%

    // Task at 12pm in 8am-6pm timetable
    expect(calculateTaskPosition(12, 8, 10)).toBe(40); // 4 hours from start = 40%
  });

  it("should calculate task height correctly", () => {
    // 60-minute task in 10-hour timetable
    expect(calculateTaskHeight(60, 10)).toBe(10); // 1 hour of 10 = 10%

    // 30-minute task in 10-hour timetable
    expect(calculateTaskHeight(30, 10)).toBe(5); // 0.5 hour of 10 = 5%

    // 2-hour task in 10-hour timetable
    expect(calculateTaskHeight(120, 10)).toBe(20); // 2 hours of 10 = 20%
  });

  it("should handle fractional hours in positioning", () => {
    // Task at 9:30am in 8am-6pm timetable
    expect(calculateTaskPosition(9.5, 8, 10)).toBe(15); // 1.5 hours from start = 15%

    // Task at 2:15pm (14.25) in 8am-6pm timetable
    expect(calculateTaskPosition(14.25, 8, 10)).toBe(62.5); // 6.25 hours from start = 62.5%
  });
});

// Test end time calculation
describe("End Time Calculations", () => {
  function calculateEndTime(
    startHour: number,
    startMinute: number,
    durationMinutes: number
  ) {
    const endMinutes = startMinute + durationMinutes;
    const endHour = startHour + Math.floor(endMinutes / 60);
    const finalMinute = endMinutes % 60;
    const paddedHour = String(endHour % 24).padStart(2, "0");
    const paddedMinute = String(finalMinute).padStart(2, "0");
    return `${paddedHour}:${paddedMinute}`;
  }

  it("should calculate end time without hour overflow", () => {
    expect(calculateEndTime(9, 0, 60)).toBe("10:00"); // 9:00 + 1 hour
    expect(calculateEndTime(14, 30, 90)).toBe("16:00"); // 2:30pm + 1.5 hours
  });

  it("should calculate end time with minute overflow", () => {
    expect(calculateEndTime(9, 45, 30)).toBe("10:15"); // 9:45 + 30 minutes
    expect(calculateEndTime(11, 50, 20)).toBe("12:10"); // 11:50 + 20 minutes
  });

  it("should handle day overflow", () => {
    expect(calculateEndTime(23, 30, 60)).toBe("00:30"); // 11:30pm + 1 hour = 12:30am next day
    expect(calculateEndTime(22, 0, 180)).toBe("01:00"); // 10pm + 3 hours = 1am next day
  });
});

// Test color and styling logic
describe("Task Styling Logic", () => {
  function getTaskColor(isTimeSensitive: boolean, isCompleted: boolean) {
    const baseColor = isTimeSensitive
      ? "hsl(var(--primary))"
      : "hsl(var(--secondary-foreground))";

    const opacity = isCompleted ? 0.5 : 1;

    return { baseColor, opacity };
  }

  function getTaskFontSize(duration: number, titleLength: number) {
    if (duration >= 60) {
      return "text-sm";
    } else if (duration >= 30) {
      return `min(0.75rem, max(0.55rem, calc(1.1rem - 0.03rem * ${titleLength})))`;
    } else {
      return `min(0.65rem, max(0.45rem, calc(0.9rem - 0.035rem * ${titleLength})))`;
    }
  }

  it("should return correct colors for different task types", () => {
    const timeSensitive = getTaskColor(true, false);
    const nonTimeSensitive = getTaskColor(false, false);
    const completed = getTaskColor(true, true);

    expect(timeSensitive.baseColor).toBe("hsl(var(--primary))");
    expect(nonTimeSensitive.baseColor).toBe("hsl(var(--secondary-foreground))");
    expect(completed.opacity).toBe(0.5);
  });

  it("should calculate appropriate font sizes", () => {
    expect(getTaskFontSize(60, 10)).toBe("text-sm");
    expect(getTaskFontSize(45, 15)).toContain("calc(1.1rem - 0.03rem * 15)");
    expect(getTaskFontSize(15, 20)).toContain("calc(0.9rem - 0.035rem * 20)");
  });
});

// Test auto-scheduling algorithm components
describe("Auto-Scheduling Utilities", () => {
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

  it("should parse datetime arrays correctly", () => {
    const result = parseLocalDateTimeArr("2025-08-19T14:30:00");
    expect(result).toEqual([2025, 8, 19, 14, 30, 0]);
  });

  it("should convert datetime arrays to minutes correctly", () => {
    const morning = [2025, 8, 19, 9, 30, 0] as [
      number,
      number,
      number,
      number,
      number,
      number
    ];
    const afternoon = [2025, 8, 19, 14, 45, 30] as [
      number,
      number,
      number,
      number,
      number,
      number
    ];

    expect(toMinutes(morning)).toBe(9 * 60 + 30);
    expect(toMinutes(afternoon)).toBe(14 * 60 + 45 + 0.5);
  });

  it("should compare datetime arrays correctly", () => {
    const earlier = [2025, 8, 19, 9, 0, 0] as [
      number,
      number,
      number,
      number,
      number,
      number
    ];
    const later = [2025, 8, 19, 14, 0, 0] as [
      number,
      number,
      number,
      number,
      number,
      number
    ];
    const same = [2025, 8, 19, 9, 0, 0] as [
      number,
      number,
      number,
      number,
      number,
      number
    ];

    expect(compareDateTimeArr(earlier, later)).toBeLessThan(0);
    expect(compareDateTimeArr(later, earlier)).toBeGreaterThan(0);
    expect(compareDateTimeArr(earlier, same)).toBe(0);
  });
});

// Test ISO format validation and conversion
describe("ISO Format Handling", () => {
  function normalizeISOString(input: string): string {
    let iso = input;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) {
      iso = iso + ".000Z";
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)) {
      iso = iso + ":00.000Z";
    }
    return iso;
  }

  it("should normalize incomplete ISO strings", () => {
    expect(normalizeISOString("2025-08-19T14:30")).toBe(
      "2025-08-19T14:30:00.000Z"
    );
    expect(normalizeISOString("2025-08-19T14:30:00")).toBe(
      "2025-08-19T14:30:00.000Z"
    );
    expect(normalizeISOString("2025-08-19T14:30:00.000Z")).toBe(
      "2025-08-19T14:30:00.000Z"
    );
  });

  it("should handle various input formats", () => {
    const inputs = [
      "2025-08-19T09:00",
      "2025-08-19T09:00:00",
      "2025-08-19T09:00:00.000Z",
    ];

    inputs.forEach((input) => {
      const result = normalizeISOString(input);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
    });
  });
});
