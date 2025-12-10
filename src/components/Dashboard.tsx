"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WeeklyBucket } from "./WeeklyBucket";
import { WeekDetail } from "./WeekDetail";
import { DisrespectForm } from "./DisrespectForm";
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
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"log" | "friends">("log");
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisrespects();
  }, [fetchDisrespects]);

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

  const totalThisWeek = getDisrespectsForWeek(currentWeekStart).length;

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
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-1">This Week&apos;s Bucket</p>
              <p className="text-4xl font-bold">{totalThisWeek}</p>
              <p className="text-zinc-400 text-sm mt-1">
                {totalThisWeek === 0
                  ? "Suspiciously quiet..."
                  : totalThisWeek < 3
                  ? "Not too bad"
                  : totalThisWeek < 5
                  ? "Building up"
                  : "Rough week"}
              </p>
            </div>
            <div className="text-6xl">
              {totalThisWeek === 0
                ? "😌"
                : totalThisWeek < 3
                ? "😤"
                : totalThisWeek < 5
                ? "😠"
                : "🤬"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Buckets */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold">Weekly Buckets</h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-52 bg-zinc-900 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
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
            )}

            {/* Week Detail View */}
            {selectedWeek && (
              <WeekDetail
                weekStart={selectedWeek}
                disrespects={getDisrespectsForWeek(selectedWeek)}
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
                onClick={() => setActiveTab("log")}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  activeTab === "log"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Log
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                  activeTab === "friends"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Friends
              </button>
            </div>

            {activeTab === "log" ? (
              <DisrespectForm onSuccess={fetchDisrespects} />
            ) : (
              <FriendsList />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
