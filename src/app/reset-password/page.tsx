"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-zinc-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-400 mb-4">Password Reset!</h1>
        <p className="text-zinc-300">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 p-8 rounded-lg shadow-xl w-full max-w-md">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        Reset Password
      </h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-zinc-300 mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded text-white focus:outline-none focus:border-red-500"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-zinc-300 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded text-white focus:outline-none focus:border-red-500"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 text-white rounded font-medium transition-colors"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Suspense fallback={
        <div className="bg-zinc-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
