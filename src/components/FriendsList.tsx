"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, CategoryKey, WIN_CATEGORIES, WinCategoryKey, getWeekStart, formatWeekLabel, getPastWeeks } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface SearchResult {
  id: string;
  name: string;
  username: string;
  friendshipStatus: string | null;
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

interface Win {
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

const WIN_CATEGORY_COLORS: Record<WinCategoryKey, string> = {
  clutch_moment: "bg-green-500",
  had_your_back: "bg-blue-500",
  real_talk: "bg-teal-500",
  goat_behavior: "bg-emerald-500",
};

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendDisrespects, setFriendDisrespects] = useState<Disrespect[]>([]);
  const [friendWins, setFriendWins] = useState<Win[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [friendViewMode, setFriendViewMode] = useState<"disrespects" | "wins">("disrespects");
  const [inviteUrl, setInviteUrl] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Search users with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddFriend = async (friendId: string, friendName: string) => {
    setAdding(friendId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess(`Friend request sent to ${friendName}!`);
      setQuery("");
      setSearchResults([]);
      fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAdding(null);
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

  const viewFriendData = async (friend: Friend) => {
    setSelectedFriend(friend);
    setSelectedWeek(getWeekStart()); // Default to current week
    setFriendViewMode("disrespects");
    try {
      const [disrespectsRes, winsRes] = await Promise.all([
        fetch(`/api/friends/${friend.id}/disrespects?weeks=8`),
        fetch(`/api/friends/${friend.id}/wins?weeks=8`),
      ]);
      const disrespectsData = await disrespectsRes.json();
      const winsData = await winsRes.json();
      setFriendDisrespects(disrespectsData.disrespects || []);
      setFriendWins(winsData.wins || []);
    } catch (error) {
      console.error("Failed to fetch friend data:", error);
    }
  };

  const generateInviteLink = async () => {
    setGeneratingInvite(true);
    try {
      const res = await fetch("/api/invites", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setInviteUrl(data.inviteUrl);
      }
    } catch (error) {
      console.error("Failed to generate invite:", error);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getDisrespectsForWeek = (weekStart: Date) => {
    return friendDisrespects.filter((d) => {
      const dWeekStart = new Date(d.weekStart);
      return dWeekStart.getTime() === weekStart.getTime();
    });
  };

  const getWinsForWeek = (weekStart: Date) => {
    return friendWins.filter((w) => {
      const wWeekStart = new Date(w.weekStart);
      return wWeekStart.getTime() === weekStart.getTime();
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
    const weekWins = selectedWeek ? getWinsForWeek(selectedWeek) : [];
    const items = friendViewMode === "disrespects" ? weekDisrespects : weekWins;
    const total = items.length;

    const fillLevel = Math.min(total, 10);
    const fillPercent = (fillLevel / 10) * 100;

    // Calculate category breakdown for bucket - handle each mode separately for type safety
    const categorySegments = friendViewMode === "disrespects"
      ? (Object.keys(CATEGORIES) as CategoryKey[])
          .map((cat) => ({
            category: cat,
            count: items.filter((item) => item.category === cat).length,
          }))
          .map((s) => ({
            ...s,
            percent: total > 0 ? (s.count / total) * fillPercent : 0,
          }))
          .filter((s) => s.count > 0)
      : (Object.keys(WIN_CATEGORIES) as WinCategoryKey[])
          .map((cat) => ({
            category: cat,
            count: items.filter((item) => item.category === cat).length,
          }))
          .map((s) => ({
            ...s,
            percent: total > 0 ? (s.count / total) * fillPercent : 0,
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

        {/* View mode toggle */}
        <div className="flex gap-2 mb-4 bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setFriendViewMode("disrespects")}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              friendViewMode === "disrespects"
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Disrespects
          </button>
          <button
            onClick={() => setFriendViewMode("wins")}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              friendViewMode === "wins"
                ? "bg-green-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Wins
          </button>
        </div>

        {/* Week selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {weeks.map((week) => {
            const isSelected = selectedWeek?.getTime() === week.getTime();
            const isCurrentWeek = week.getTime() === currentWeekStart.getTime();
            const weekCount = friendViewMode === "disrespects"
              ? getDisrespectsForWeek(week).length
              : getWinsForWeek(week).length;
            return (
              <button
                key={week.toISOString()}
                onClick={() => setSelectedWeek(week)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? friendViewMode === "disrespects" ? "bg-red-600 text-white" : "bg-green-600 text-white"
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
                {friendViewMode === "disrespects"
                  ? categorySegments.map((segment) => (
                      <div
                        key={segment.category}
                        className={`${CATEGORY_COLORS[segment.category as CategoryKey]} transition-all duration-500`}
                        style={{ height: `${(segment.percent / 100) * 96}px` }}
                      />
                    ))
                  : categorySegments.map((segment) => (
                      <div
                        key={segment.category}
                        className={`${WIN_CATEGORY_COLORS[segment.category as WinCategoryKey]} transition-all duration-500`}
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
                {friendViewMode === "disrespects"
                  ? categorySegments.map((segment) => {
                      const catInfo = CATEGORIES[segment.category as CategoryKey];
                      const pct = Math.round((segment.count / total) * 100);
                      return (
                        <span
                          key={segment.category}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-800"
                        >
                          <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[segment.category as CategoryKey]}`} />
                          <span>{catInfo.emoji}</span>
                          <span className="text-zinc-400">{pct}%</span>
                        </span>
                      );
                    })
                  : categorySegments.map((segment) => {
                      const catInfo = WIN_CATEGORIES[segment.category as WinCategoryKey];
                      const pct = Math.round((segment.count / total) * 100);
                      return (
                        <span
                          key={segment.category}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-800"
                        >
                          <span className={`w-2 h-2 rounded-full ${WIN_CATEGORY_COLORS[segment.category as WinCategoryKey]}`} />
                          <span>{catInfo.emoji}</span>
                          <span className="text-zinc-400">{pct}%</span>
                        </span>
                      );
                    })}
              </div>
            )}

            {/* Items list */}
            {items.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">
                No shared {friendViewMode} this week
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item) => {
                    const catInfo = friendViewMode === "disrespects"
                      ? CATEGORIES[item.category as CategoryKey]
                      : WIN_CATEGORIES[item.category as WinCategoryKey];
                    const colorClass = friendViewMode === "disrespects"
                      ? CATEGORY_COLORS[item.category as CategoryKey]
                      : WIN_CATEGORY_COLORS[item.category as WinCategoryKey];
                    const date = new Date(item.createdAt);
                    const timeStr = date.toLocaleDateString("en-US", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{catInfo.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                              <span className="text-sm font-medium">{catInfo.label}</span>
                            </div>
                            {item.note && (
                              <p className="text-zinc-300 text-sm mt-1 italic">&ldquo;{item.note}&rdquo;</p>
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

      {/* Search Friends */}
      <div className="space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        {/* Search Results */}
        {query.length >= 2 && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
            {searching ? (
              <p className="p-3 text-zinc-400 text-sm">Searching...</p>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-zinc-700">
                {searchResults.map((user) => (
                  <div key={user.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-white">{user.name}</span>
                      <span className="text-zinc-500 text-sm ml-2">@{user.username}</span>
                    </div>
                    {user.friendshipStatus === "accepted" ? (
                      <span className="text-xs text-zinc-500">Already friends</span>
                    ) : user.friendshipStatus === "pending" ? (
                      <span className="text-xs text-zinc-500">Pending</span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.id, user.name)}
                        disabled={adding === user.id}
                        className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 rounded-lg transition-colors"
                      >
                        {adding === user.id ? "Sending..." : "Add"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-3 text-zinc-500 text-sm">No users found</p>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
      </div>

      {/* Invite Link */}
      <div className="border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400 mb-2">Or share an invite link</p>
        {inviteUrl ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-sm truncate"
            />
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <button
            onClick={generateInviteLink}
            disabled={generatingInvite}
            className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-xl transition-colors"
          >
            {generatingInvite ? "Generating..." : "Get Invite Link"}
          </button>
        )}
      </div>

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
                <div>
                  <span className="text-sm">{req.from.name}</span>
                  <span className="text-zinc-500 text-xs ml-2">@{req.from.username}</span>
                </div>
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
                onClick={() => viewFriendData(friend)}
                className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-left"
              >
                <div>
                  <span>{friend.name}</span>
                  <span className="text-zinc-500 text-xs ml-2">@{friend.username}</span>
                </div>
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
