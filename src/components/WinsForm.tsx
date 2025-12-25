"use client";

import { useState } from "react";
import { WIN_CATEGORIES, WinCategoryKey } from "@/lib/utils";

interface WinsFormProps {
  onSuccess: () => void;
}

export function WinsForm({ onSuccess }: WinsFormProps) {
  const [category, setCategory] = useState<WinCategoryKey | "">("");
  const [note, setNote] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, note, isShared }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log win");
      }

      setCategory("");
      setNote("");
      setIsShared(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">Log a Win</h2>

      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          What happened?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(WIN_CATEGORIES) as WinCategoryKey[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                category === cat
                  ? "border-green-500 bg-green-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              <span className="text-2xl block mb-1">{WIN_CATEGORIES[cat].emoji}</span>
              <span className="text-sm font-medium">{WIN_CATEGORIES[cat].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          What happened? (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the win..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Share Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isShared ? "bg-green-600" : "bg-zinc-700"
            }`}
            onClick={() => setIsShared(!isShared)}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isShared ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </div>
          <span className="text-sm text-zinc-300">Share with friends</span>
        </label>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!category || loading}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? "Logging..." : "Log Win"}
      </button>
    </form>
  );
}
