"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

const THEMES = [
  { id: "emerald", name: "Neon Emerald", color: "bg-emerald-500", text: "text-emerald-400", button: "bg-emerald-600 hover:bg-emerald-500", focus: "focus:border-emerald-500" },
  { id: "blue", name: "Cyber Blue", color: "bg-blue-500", text: "text-blue-400", button: "bg-blue-600 hover:bg-blue-500", focus: "focus:border-blue-500" },
  { id: "purple", name: "Void Purple", color: "bg-purple-500", text: "text-purple-400", button: "bg-purple-600 hover:bg-purple-500", focus: "focus:border-purple-500" },
  { id: "rose", name: "Crimson Rose", color: "bg-rose-500", text: "text-rose-400", button: "bg-rose-600 hover:bg-rose-500", focus: "focus:border-rose-500" },
  { id: "amber", name: "Solar Amber", color: "bg-amber-500", text: "text-amber-400", button: "bg-amber-600 hover:bg-amber-500", focus: "focus:border-amber-500" }
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [themeColor, setThemeColor] = useState("emerald");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
          setDisplayName(profileData.display_name || "");
          setThemeColor(profileData.theme_color || "emerald");
          setBackgroundUrl(profileData.background_url || "");
          setAvatarUrl(profileData.avatar_url || "");
          setBio(profileData.bio || "System is optimal. Ready for daily tasks.");

          // Cache to local storage so login screen remembers
          localStorage.setItem("dailyju_theme", profileData.theme_color || "emerald");
          localStorage.setItem("dailyju_bg", profileData.background_url || "");
          localStorage.setItem("dailyju_avatar", profileData.avatar_url || "");
        }
      }
      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        theme_color: themeColor,
        background_url: backgroundUrl,
        avatar_url: avatarUrl,
        bio: bio
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Error saving profile: " + error.message);
    } else {
      setMessage("Profile updated successfully!");
      // Update browser memory instantly
      localStorage.setItem("dailyju_theme", themeColor);
      localStorage.setItem("dailyju_bg", backgroundUrl);
      localStorage.setItem("dailyju_avatar", avatarUrl);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-emerald-500 font-mono">
        <p className="animate-pulse">Loading Configuration...</p>
      </div>
    );
  }

  const activeTheme = THEMES.find(t => t.id === themeColor) || THEMES[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans p-4 md:p-8 relative">
      
      {backgroundUrl && (
        <>
          <div 
            className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat fixed"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent fixed pointer-events-none" />
        </>
      )}

      <div className="max-w-2xl mx-auto relative z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <a 
            href="/dashboard" 
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium font-mono"
          >
            ← Back to Command Center
          </a>
        </div>

        <div className="mb-8 flex items-center gap-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center shadow-lg">
              <span className="text-2xl text-zinc-600">?</span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Settings</h1>
            <p className="text-zinc-300">Configure your personal operator profile and interface aesthetics.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col gap-8">
            
            <div className="space-y-4">
              <h2 className="text-sm font-mono text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">OPERATOR IDENTITY</h2>
              
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">DISPLAY NAME</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${activeTheme.focus} transition-all`}
                  placeholder="e.g., Jula"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">AVATAR IMAGE URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${activeTheme.focus} transition-all`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">CURRENT STATUS / BIO</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${activeTheme.focus} transition-all`}
                  placeholder="System is optimal..."
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-mono text-zinc-400 tracking-widest border-b border-zinc-800 pb-2">INTERFACE AESTHETICS</h2>
              
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-3">SYSTEM ACCENT COLOR</label>
                <div className="flex flex-wrap gap-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        themeColor === theme.id 
                          ? `bg-zinc-800 border-zinc-500 text-white shadow-lg` 
                          : `bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-600`
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${theme.color}`}></span>
                      <span className="text-xs font-mono">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">BACKGROUND WALLPAPER URL</label>
                <input
                  type="url"
                  value={backgroundUrl}
                  onChange={(e) => setBackgroundUrl(e.target.value)}
                  className={`w-full rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 text-white outline-none ${activeTheme.focus} transition-all`}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-zinc-800">
              {message && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${message.includes("Error") ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800 text-white border-zinc-600"}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-lg px-8 py-3 font-bold tracking-widest text-zinc-950 transition-all disabled:opacity-50 ${activeTheme.button} hover:opacity-90 shadow-lg`}
                >
                  {saving ? "UPDATING..." : "SAVE CONFIGURATION"}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}