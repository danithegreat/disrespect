"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot";

interface AuthFormProps {
  inviteToken?: string;
  inviterName?: string;
}

export function AuthForm({ inviteToken, inviterName }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(inviteToken ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          setSuccess("Check your email for reset instructions");
        } else {
          const data = await res.json();
          setError(data.error || "Something went wrong");
        }
        return;
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name, username, inviteToken };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome Back";
      case "register": return "Join Disrespect";
      case "forgot": return "Reset Password";
    }
  };

  const getSubtitle = () => {
    if (mode === "register" && inviterName) {
      return `${inviterName} invited you to join`;
    }
    switch (mode) {
      case "login": return "Log your workplace indignities";
      case "register": return "Start tracking the clownery";
      case "forgot": return "We'll send you a reset link";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">{getTitle()}</h1>
        <p className="text-zinc-400 text-center mb-8">{getSubtitle()}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="coolmanager123"
                  pattern="[a-zA-Z0-9_]{3,20}"
                  title="3-20 characters, letters, numbers, and underscores"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="you@company.com"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-400/10 px-4 py-2 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading
              ? "Loading..."
              : mode === "login"
                ? "Sign In"
                : mode === "register"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
            <button
              onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors block w-full"
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccess("");
            }}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : mode === "register"
                ? "Already have an account? Sign in"
                : "Back to sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
