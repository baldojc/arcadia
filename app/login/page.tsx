"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Local Storage State for Theme Memory
  const [themeName, setThemeName] = useState("emerald");
  const [bg, setBg] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    // When the page loads, check if the browser remembers her preferences
    setThemeName(localStorage.getItem("dailyju_theme") || "emerald");
    setBg(localStorage.getItem("dailyju_bg") || "");
    setAvatar(localStorage.getItem("dailyju_avatar") || "");
  }, []);

  const getThemeClasses = (t: string) => {
    switch (t) {
      case 'blue': return { text: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-500', focus: 'focus:border-blue-500 focus:ring-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', border: 'border-blue-500/50' };
      case 'purple': return { text: 'text-purple-400', button: 'bg-purple-600 hover:bg-purple-500', focus: 'focus:border-purple-500 focus:ring-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', border: 'border-purple-500/50' };
      case 'rose': return { text: 'text-rose-400', button: 'bg-rose-600 hover:bg-rose-500', focus: 'focus:border-rose-500 focus:ring-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', border: 'border-rose-500/50' };
      case 'amber': return { text: 'text-amber-400', button: 'bg-amber-600 hover:bg-amber-500', focus: 'focus:border-amber-500 focus:ring-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', border: 'border-amber-500/50' };
      default: return { text: 'text-emerald-400', button: 'bg-emerald-600 hover:bg-emerald-500', focus: 'focus:border-emerald-500 focus:ring-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', border: 'border-emerald-500/50' };
    }
  };

  const theme = getThemeClasses(themeName);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-mono text-zinc-200 relative">
      
      {bg && (
        <>
          <div 
            className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat fixed"
            style={{ backgroundImage: `url(${bg})` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent fixed pointer-events-none" />
        </>
      )}

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl relative z-10">
        <div className="mb-8 text-center flex flex-col items-center">
          
          {/* AVATAR DISPLAY */}
          {avatar ? (
            <img src={avatar} alt="Operator" className={`w-24 h-24 rounded-full object-cover border-4 ${theme.border} mb-4 shadow-lg`} />
          ) : (
            <div className={`w-24 h-24 rounded-full bg-zinc-950 border-4 ${theme.border} mb-4 flex items-center justify-center shadow-lg`}>
              <span className={`text-4xl ${theme.text}`}>D</span>
            </div>
          )}

          <h1 className={`text-4xl font-black tracking-wider ${theme.text}`}>DailyJu</h1>
          <p className="mt-2 text-xs text-zinc-400 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs tracking-widest text-zinc-500">IDENTIFICATION</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${theme.focus} focus:ring-1 transition-all`}
              placeholder="operator@dailyju.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs tracking-widest text-zinc-500">PASSCODE</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${theme.focus} focus:ring-1 transition-all`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-sans font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 rounded-lg p-3 font-black tracking-widest text-zinc-950 transition-colors disabled:opacity-50 ${theme.button} ${theme.glow}`}
          >
            {loading ? "AUTHENTICATING..." : "ACCESS SYSTEM"}
          </button>
        </form>
      </div>
    </main>
  );
}