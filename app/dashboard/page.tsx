"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          localStorage.setItem("dailyju_theme", profileData.theme_color || "emerald");
          localStorage.setItem("dailyju_bg", profileData.background_url || "");
          localStorage.setItem("dailyju_avatar", profileData.avatar_url || "");
        }
      }
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-emerald-500 font-mono">
        <p className="animate-pulse">Verifying Biometrics...</p>
      </div>
    );
  }

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'blue': return { text: 'text-blue-400', bg: 'bg-blue-500', hover: 'hover:text-blue-400', border: 'border-blue-500/50' };
      case 'purple': return { text: 'text-purple-400', bg: 'bg-purple-500', hover: 'hover:text-purple-400', border: 'border-purple-500/50' };
      case 'rose': return { text: 'text-rose-400', bg: 'bg-rose-500', hover: 'hover:text-rose-400', border: 'border-rose-500/50' };
      case 'amber': return { text: 'text-amber-400', bg: 'bg-amber-500', hover: 'hover:text-amber-400', border: 'border-amber-500/50' };
      default: return { text: 'text-emerald-400', bg: 'bg-emerald-500', hover: 'hover:text-emerald-400', border: 'border-emerald-500/50' };
    }
  };

  const theme = getThemeClasses(profile?.theme_color);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans relative">
      
      {profile?.background_url && (
        <>
          <div 
            className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat fixed"
            style={{ backgroundImage: `url(${profile.background_url})` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent fixed pointer-events-none" />
        </>
      )}

      <div className="relative z-10 pb-20">
        <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded ${theme.bg} flex items-center justify-center text-zinc-950 font-bold`}>D</div>
                <span className={`font-bold tracking-wider ${theme.text}`}>DailyJu</span>
              </div>
              
              <div className="flex items-center gap-6">
                <Link href="/dashboard/settings" className={`text-xs font-mono text-zinc-400 ${theme.hover} transition-colors`}>
                  [ SETTINGS ]
                </Link>
                <button onClick={handleLogout} className="text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors">
                  [ DISCONNECT ]
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="mb-12 flex items-center gap-6">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className={`w-24 h-24 rounded-full object-cover border-4 ${theme.border} shadow-2xl`} />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black ${theme.bg} text-zinc-950 shadow-2xl`}>
                {profile?.display_name ? profile.display_name[0].toUpperCase() : "O"}
              </div>
            )}
            <div>
             <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Welcome back, <span className={`${theme.text}`}>{profile?.display_name || "Operator"}</span>.
              </h1>
              <p className="text-zinc-300 font-mono text-sm md:text-base">
                {profile?.bio || "System is optimal. Ready for daily tasks."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Link href="/dashboard/diary" className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm p-6 hover:border-zinc-500 transition-all cursor-pointer block hover:-translate-y-1 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-100">Personal Log</h2>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">📖</span>
              </div>
              <p className="text-sm text-zinc-400">Access daily encrypted journal entries and thoughts.</p>
            </Link>

            <Link href="/dashboard/study" className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm p-6 hover:border-zinc-500 transition-all cursor-pointer block hover:-translate-y-1 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-100">Study Operations</h2>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">🧬</span>
              </div>
              <p className="text-sm text-zinc-400">Manage tasks, Pomodoro sessions, and MedTech review.</p>
            </Link>

            <Link href="/dashboard/anime" className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm p-6 hover:border-zinc-500 transition-all cursor-pointer block hover:-translate-y-1 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-100">Visual Archive</h2>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">🎬</span>
              </div>
              <p className="text-sm text-zinc-400">Track current series, episode progress, and test memory.</p>
            </Link>
          </div>

          {/* NEW: REST & RECOVERY GAMING SECTOR */}
          <div className="mb-6 flex items-center gap-4">
            <h2 className={`text-lg font-bold tracking-widest uppercase font-mono ${theme.text}`}>Rest & Recovery</h2>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
           {/* GAME 1 */}
            <Link 
              href="/dashboard/microbe-match"
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 hover:border-zinc-500 transition-all text-left overflow-hidden shadow-lg block"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity`}></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-xl font-bold text-white">Microbe Match</h3>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">🧫</span>
              </div>
              <p className="text-sm text-zinc-400 relative z-10 mb-4">Flip cards and match laboratory specimens. A relaxing brain-trainer.</p>
              <span className={`text-[10px] font-mono border border-zinc-700 px-2 py-1 rounded bg-zinc-950 ${theme.text}`}>INITIALIZE MODULE {">"}</span>
            </Link>

            {/* GAME 2 */}
            <Link 
              href="/dashboard/neon-grid"
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 hover:border-zinc-500 transition-all text-left overflow-hidden shadow-lg block"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity`}></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-xl font-bold text-white">Neon Grid</h3>
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">✖️</span>
              </div>
              <p className="text-sm text-zinc-400 relative z-10 mb-4">Classic low-latency Tic-Tac-Toe logic simulation against the AI.</p>
              <span className={`text-[10px] font-mono border border-zinc-700 px-2 py-1 rounded bg-zinc-950 ${theme.text}`}>INITIALIZE MODULE {">"}</span>
            </Link>

          </div>

        </main>
      </div>
    </div>
  );
}