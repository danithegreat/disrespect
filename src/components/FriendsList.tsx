"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, CategoryKey, getWeekStart, formatWeekLabel, getPastWeeks } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface PendingRequest {
  id: string;
  from: Friend;
}

interface Disrespect {
  id: string;
  category: string;
  note: string | null;
  weekStart: string;
  createdAt: string;
}

// Tailwind colors for each category
const CATEGORY_COLORS: Record<CategoryKey, string> = {
  credit_theft: "bg-red-500",
  thrown_under_bus: "bg-orange-500",
  ghosted: "bg-purple-500",
  general_clowning: "bg-yellow-500",
};

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendDisrespects, setFriendDisrespects] = useState<Disrespect[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriends(data.friends || []);
      setPendingRequests(data.pendingRequests || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess("Friend request sent!");
      setEmail("");
      fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAdding(false);
    }
  };

  const handleRequest = async (friendshipId: string, action: "accept" | "reject") => {
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      fetchFriends();
    } catch (error) {
      console.error("Failed to handle request:", error);
    }
  };

  const viewFriendDisrespects = async (friend: Friend) => {
    setSelectedFriend(friend);
    setSelectedWeek(getWeekStart()); // Default to current week
    try {
      const res = await fetch(`/api/friends/${friend.id}/disrespects?weeks=8`);
      const data = await res.json();
      setFriendDisrespects(data.disrespects || []);
    } catch (error) {
      console.error("Failed to fetch friend disrespects:", error);
    }
  };

  const getDisrespectsForWeek = (weekStart: Date) => {
    return friendDisrespects.filter((d) => {
      const dWeekStart = new Date(d.weekStart);
      return dWeekStart.getTime() === weekStart.getTime();
    });
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-10 bg-zinc-800 rounded" />
          <div className="h-10 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (selectedFriend) {
    const weeks = getPastWeeks(8);
    const currentWeekStart = getWeekStart();
    const weekDisrespects = selectedWeek ? getDisrespectsForWeek(selectedWeek) : [];
    const total = weekDisrespects.length;

    // Calculate category breakdown for bucket
    const byCategory = Object.keys(CATEGORIES).reduce((acc, cat) => {
      acc[cat as CategoryKey] = weekDisrespects.filter((d) => d.category === cat).length;
      return acc;
    }, {} as Record<CategoryKey, number>);

    const fillLevel = Math.min(total, 10);
    const fillPercent = (fillLevel / 10) * 100;

    const categorySegments = (Object.keys(CATEGORIES) as CategoryKey[])
      .map((cat) => ({
        category: cat,
        count: byCategory[cat],
        percent: total > 0 ? (byCategory[cat] / total) * fillPercent : 0,
      }))
      .filter((s) => s.count > 0);

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{selectedFriend.name}&apos;s Week</h2>
          <button
            onClick={() => {
              setSelectedFriend(null);
              setSelectedWeek(null);
            }}
            className="text-zinc-400 hover:text-white"
          >
            ← Back
          </button>
        </div>

        {/* Week selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {weeks.map((week) => {
            const isSelected = selectedWeek?.getTime() === week.getTime();
            const isCurrentWeek = week.getTime() === currentWeekStart.getTime();
            const weekCount = getDisrespectsForWeek(week).length;
            return (
              <button
                key={week.toISOString()}
                onClick={() => setSelectedWeek(week)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <div>{isCurrentWeek ? "This Week" : formatWeekLabel(week).replace("Week of ", "")}</div>
                <div className="font-bold">{weekCount}</div>
              </button>
            );
          })}
        </div>

        {selectedWeek && (
          <>
            {/* Mini bucket visualization */}
            <div className="relative h-24 w-full bg-zinc-800 rounded-xl overflow-hidden mb-4">
              <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
                {categorySegments.map((segment) => (
                  <div
                    key={segment.category}
                    className={`${CATEGORY_COLORS[segment.category]} transition-all duration-500`}
                    style={{ height: `${(segment.percent / 100) * 96}px` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white drop-shadow-lg">
                  {total}
                </span>
              </div>
            </div>

            {/* Category legend */}
            {categorySegments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categorySegments.map((segment) => {
                  const catInfo = CATEGORIES[segment.category];
                  const pct = Math.round((segment.count / total) * 100);
                  return (
                    <span
                      key={segment.category}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-800"
                    >
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[segment.category]}`} />
                      <span>{catInfo.emoji}</span>
                      <span className="text-zinc-400">{pct}%</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Disrespect details with notes */}
            {weekDisrespects.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">
                No shared disrespects this week
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {weekDisrespects
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((d) => {
                    const cat = d.category as CategoryKey;
                    const catInfo = CATEGORIES[cat];
                    const date = new Date(d.createdAt);
                    const timeStr = date.toLocaleDateString("en-US", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={d.id}
                        className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{catInfo.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`}
                              />
                              <span className="text-sm font-medium">{catInfo.label}</span>
                            </div>
                            {d.note && (
                              <p className="text-zinc-300 text-sm mt-1 italic">&ldquo;{d.note}&rdquo;</p>
                            )}
                            <p className="text-xs text-zinc-500 mt-1">{timeStr}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-bold">Friends</h2>

      {/* Add Friend Form */}
      <form onSubmit={handleAddFriend} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Friend's email"
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={adding || !email}
          className="w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {adding ? "Sending..." : "Add Friend"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
      </form>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">
            Pending Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
              >
                <span className="text-sm">{req.from.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(req.id, "accept")}
                    className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequest(req.id, "reject")}
                    className="text-xs px-3 py-1 bg-zinc-600 hover:bg-zinc-500 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Your Friends</h3>
          <div className="space-y-2">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => viewFriendDisrespects(friend)}
                className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-left"
              >
                <span>{friend.name}</span>
                <span className="text-zinc-400 text-sm">View →</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-zinc-500 text-center text-sm">
          No friends yet. Add someone to share your disrespects!
        </p>
      )}
    </div>
  );
}
