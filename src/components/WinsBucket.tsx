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

interface WinsBucketProps {
  weekStart: Date;
  wins: Win[];
  isCurrentWeek: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

const CATEGORY_COLORS: Record<WinCategoryKey, string> = {
  clutch_moment: "bg-green-500",
  had_your_back: "bg-blue-500",
  real_talk: "bg-teal-500",
  goat_behavior: "bg-emerald-500",
};

export function WinsBucket({
  weekStart,
  wins,
  isCurrentWeek,
  onSelect,
  isSelected,
}: WinsBucketProps) {
  const total = wins.length;
  const byCategory = Object.keys(WIN_CATEGORIES).reduce((acc, cat) => {
    acc[cat as WinCategoryKey] = wins.filter((w) => w.category === cat).length;
    return acc;
  }, {} as Record<WinCategoryKey, number>);

  const fillLevel = Math.min(total, 10);
  const fillPercent = (fillLevel / 10) * 100;

  const categorySegments = (Object.keys(WIN_CATEGORIES) as WinCategoryKey[])
    .map((cat) => ({
      category: cat,
      count: byCategory[cat],
      percent: total > 0 ? (byCategory[cat] / total) * fillPercent : 0,
    }))
    .filter((s) => s.count > 0);

  return (
    <button
      onClick={onSelect}
      className={`relative w-full p-4 rounded-2xl border-2 transition-all ${
        isSelected
          ? "border-green-500 bg-green-500/10"
          : isCurrentWeek
          ? "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      }`}
    >
      {isCurrentWeek && (
        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-green-600 text-xs font-semibold rounded-full">
          This Week
        </div>
      )}

      <div className="text-sm text-zinc-400 mb-3 text-left">
        {formatWeekLabel(weekStart)}
      </div>

      {/* Bucket visualization with stacked colors */}
      <div className="relative h-32 w-full bg-zinc-800 rounded-xl overflow-hidden mb-3">
        <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
          {categorySegments.map((segment) => (
            <div
              key={segment.category}
              className={`${CATEGORY_COLORS[segment.category]} transition-all duration-500`}
              style={{ height: `${(segment.percent / 100) * 128}px` }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <span className="text-4xl font-bold text-white drop-shadow-lg">
            {total}
          </span>
        </div>

        {total > 10 && (
          <div className="absolute top-2 right-2 bg-zinc-900/80 text-xs px-2 py-1 rounded-full">
            +{total - 10} more
          </div>
        )}
      </div>

      {/* Category breakdown legend */}
      <div className="flex flex-wrap gap-1.5">
        {categorySegments.map((segment) => {
          const catInfo = WIN_CATEGORIES[segment.category];
          const pct = Math.round((segment.count / total) * 100);
          return (
            <span
              key={segment.category}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-zinc-800"
            >
              <span
                className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[segment.category]}`}
              />
              <span>{catInfo.emoji}</span>
              <span className="text-zinc-400">{pct}%</span>
            </span>
          );
        })}
        {total === 0 && (
          <span className="text-zinc-600 text-xs">No wins logged</span>
        )}
      </div>
    </button>
  );
}
