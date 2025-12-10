// Get the Monday of the week for a given date
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format a date as "Week of Mon DD"
export function formatWeekLabel(weekStart: Date): string {
  const month = weekStart.toLocaleDateString("en-US", { month: "short" });
  const day = weekStart.getDate();
  return `Week of ${month} ${day}`;
}

// Get weeks going back from current week
export function getPastWeeks(count: number): Date[] {
  const weeks: Date[] = [];
  const currentWeek = getWeekStart();

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeks.push(weekStart);
  }

  return weeks;
}

export const CATEGORIES = {
  credit_theft: {
    label: "Credit Theft",
    color: "bg-red-500",
    emoji: "🏴‍☠️",
  },
  thrown_under_bus: {
    label: "Thrown Under Bus",
    color: "bg-orange-500",
    emoji: "🚌",
  },
  ghosted: {
    label: "Ghosted",
    color: "bg-purple-500",
    emoji: "👻",
  },
  general_clowning: {
    label: "General Clowning",
    color: "bg-yellow-500",
    emoji: "🤡",
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
