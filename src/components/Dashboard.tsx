"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WeeklyBucket } from "./WeeklyBucket";
import { WeekDetail } from "./WeekDetail";
import { WinsBucket } from "./WinsBucket";
import { WinsDetail } from "./WinsDetail";
import { DisrespectForm } from "./DisrespectForm";
import { WinsForm } from "./WinsForm";
import { FriendsList } from "./FriendsList";
import { getWeekStart, getPastWeeks } from "@/lib/utils";

interface Disrespect {
  id: string;
  category: string;
  note: string | null;
  weekStart: string;
  isShared: boolean;
  createdAt: string;
}

interface Win {
  id: string;
  category: string;
  note: string | null;
  weekStart: string;
  isShared: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [disrespects, setDisrespects] = useState<Disrespect[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"disrespect" | "win" | "friends">("disrespect");
  const [viewMode, setViewMode] = useState<"disrespects" | "wins">("disrespects");
  const router = useRouter();

  const fetchDisrespects = useCallback(async () => {
    try {
      const res = await fetch("/api/disrespect?weeks=8");
      const data = await res.json();
      if (data.disrespects) {
        setDisrespects(data.disrespects);
      }
    } catch (error) {
      console.error("Failed to fetch disrespects:", error);
    }
  }, []);

  const fetchWins = useCallback(async () => {
    try {
      const res = await fetch("/api/wins?weeks=8");
      const data = await res.json();
      if (data.wins) {
        setWins(data.wins);
      }
    } catch (error) {
      console.error("Failed to fetch wins:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchDisrespects(), fetchWins()]).finally(() => {
      setLoading(false);
    });
  }, [fetchDisrespects, fetchWins]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const weeks = getPastWeeks(8);
  const currentWeekStart = getWeekStart();

  const getDisrespectsForWeek = (weekStart: Date) => {
    return disrespects.filter((d) => {
      const dWeekStart = new Date(d.weekStart);
      return dWeekStart.getTime() === weekStart.getTime();
    });
  };

  const getWinsForWeek = (weekStart: Date) => {
    return wins.filter((w) => {
      const wWeekStart = new Date(w.weekStart);
      return wWeekStart.getTime() === weekStart.getTime();
    });
  };

  const totalDisrespectsThisWeek = getDisrespectsForWeek(currentWeekStart).length;
  const totalWinsThisWeek = getWinsForWeek(currentWeekStart).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Disrespect</h1>
            <p className="text-sm text-zinc-400">Hey, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Disrespects Banner */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Disrespects This Week</p>
                <p className="text-4xl font-bold">{totalDisrespectsThisWeek}</p>
                <p className="text-zinc-400 text-sm mt-1">
                  {totalDisrespectsThisWeek === 0
                    ? "Suspiciously quiet..."
                    : totalDisrespectsThisWeek < 3
                    ? "Not too bad"
                    : totalDisrespectsThisWeek < 5
                    ? "Building up"
                    : "Rough week"}
                </p>
              </div>
              <div className="text-5xl">
                {totalDisrespectsThisWeek === 0
                  ? "😌"
                  : totalDisrespectsThisWeek < 3
                  ? "😤"
                  : totalDisrespectsThisWeek < 5
                  ? "😠"
                  : "🤬"}
              </div>
            </div>
          </div>

          {/* Wins Banner */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-600/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Wins This Week</p>
                <p className="text-4xl font-bold">{totalWinsThisWeek}</p>
                <p className="text-zinc-400 text-sm mt-1">
                  {totalWinsThisWeek === 0
                    ? "Time to stack some W's"
                    : totalWinsThisWeek < 3
                    ? "Getting started"
                    : totalWinsThisWeek < 5
                    ? "On a roll"
                    : "Unstoppable"}
                </p>
              </div>
              <div className="text-5xl">
                {totalWinsThisWeek === 0
                  ? "🎯"
                  : totalWinsThisWeek < 3
                  ? "💪"
                  : totalWinsThisWeek < 5
                  ? "🔥"
                  : "🏆"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Buckets */}
          <div className="lg:col-span-2 space-y-6">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Weekly Buckets</h2>
              <div className="flex gap-2 bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => { setViewMode("disrespects"); setSelectedWeek(null); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "disrespects"
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Disrespects
                </button>
                <button
                  onClick={() => { setViewMode("wins"); setSelectedWeek(null); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "wins"
                      ? "bg-green-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Wins
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-52 bg-zinc-900 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : viewMode === "disrespects" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {weeks.map((week) => (
                  <WeeklyBucket
                    key={week.toISOString()}
                    weekStart={week}
                    disrespects={getDisrespectsForWeek(week)}
                    isCurrentWeek={week.getTime() === currentWeekStart.getTime()}
                    onSelect={() => setSelectedWeek(week)}
                    isSelected={selectedWeek?.getTime() === week.getTime()}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {weeks.map((week) => (
                  <WinsBucket
                    key={week.toISOString()}
                    weekStart={week}
                    wins={getWinsForWeek(week)}
                    isCurrentWeek={week.getTime() === currentWeekStart.getTime()}
                    onSelect={() => setSelectedWeek(week)}
                    isSelected={selectedWeek?.getTime() === week.getTime()}
                  />
                ))}
              </div>
            )}

            {/* Week Detail View */}
            {selectedWeek && viewMode === "disrespects" && (
              <WeekDetail
                weekStart={selectedWeek}
                disrespects={getDisrespectsForWeek(selectedWeek)}
                isCurrentWeek={
                  selectedWeek.getTime() === currentWeekStart.getTime()
                }
                onClose={() => setSelectedWeek(null)}
              />
            )}
            {selectedWeek && viewMode === "wins" && (
              <WinsDetail
                weekStart={selectedWeek}
                wins={getWinsForWeek(selectedWeek)}
                isCurrentWeek={
                  selectedWeek.getTime() === currentWeekStart.getTime()
                }
                onClose={() => setSelectedWeek(null)}
              />
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("disrespect")}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  activeTab === "disrespect"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Disrespect
              </button>
              <button
                onClick={() => setActiveTab("win")}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  activeTab === "win"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Win
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  activeTab === "friends"
                    ? "bg-zinc-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Friends
              </button>
            </div>

            {activeTab === "disrespect" ? (
              <DisrespectForm onSuccess={fetchDisrespects} />
            ) : activeTab === "win" ? (
              <WinsForm onSuccess={fetchWins} />
            ) : (
              <FriendsList />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
