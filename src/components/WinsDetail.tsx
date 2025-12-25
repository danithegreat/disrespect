"use client";

import { WIN_CATEGORIES, WinCategoryKey, formatWeekLabel } from "@/lib/utils";

interface Win {
  id: string;
  category: string;
  note: string | null;
  weekStart: string;
  isShared: boolean;
  createdAt: string;
}

interface WinsDetailProps {
  weekStart: Date;
  wins: Win[];
  isCurrentWeek: boolean;
  onClose: () => void;
}

export function WinsDetail({
  weekStart,
  wins,
  isCurrentWeek,
  onClose,
}: WinsDetailProps) {
  const sortedWins = [...wins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{formatWeekLabel(weekStart)}</h2>
          {isCurrentWeek && (
            <span className="text-xs text-green-400">Current Week</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {sortedWins.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <p className="text-4xl mb-2">🎯</p>
          <p>No wins logged this week</p>
          <p className="text-sm mt-1">Time to celebrate some victories!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWins.map((w) => {
            const cat = w.category as WinCategoryKey;
            const categoryInfo = WIN_CATEGORIES[cat];
            const date = new Date(w.createdAt);
            const timeStr = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={w.id}
                className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{categoryInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{categoryInfo.label}</span>
                      {w.isShared && (
                        <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">
                          Shared
                        </span>
                      )}
                    </div>
                    {w.note && (
                      <p className="text-zinc-300 text-sm mb-2">{w.note}</p>
                    )}
                    <p className="text-xs text-zinc-500">{timeStr}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
