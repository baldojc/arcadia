"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

const MOODS = [
  { label: "Optimal", emoji: "✨", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { label: "Productive", emoji: "⚡", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { label: "Reflective", emoji: "🌧️", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  { label: "Exhausted", emoji: "🔋", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  { label: "Stressed", emoji: "⚠️", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  { label: "Neutral", emoji: "☁️", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
];

export default function DiaryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Neutral");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("All");

  // NEW: Custom Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, action: () => void } | null>(null);

  useEffect(() => {
    fetchEntriesAndProfile();
  }, []);

  const fetchEntriesAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setEntries(data);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (profileData) setProfile(profileData);
    }
    setLoading(false);
  };

  const openNewEntry = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setMood("Neutral");
    setShowModal(true);
  };

  const openEditEntry = (entry: any) => {
    setIsEditing(true);
    setEditingId(entry.id);
    setTitle(entry.title || "");
    setContent(entry.content || "");
    setMood(entry.mood || "Neutral");
    setShowModal(true);
  };

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const payload = { user_id: user.id, title, content, mood };

      if (isEditing && editingId) {
        const { error } = await supabase.from("diary_entries").update(payload).eq("id", editingId);
        if (!error) {
          setShowModal(false);
          fetchEntriesAndProfile();
        }
      } else {
        const { error } = await supabase.from("diary_entries").insert([payload]);
        if (!error) {
          setShowModal(false);
          fetchEntriesAndProfile();
        }
      }
    }
  };

  const deleteEntry = () => {
    if (!editingId) return;
    setConfirmDialog({
      message: "Erase this log from the databanks? This action cannot be undone.",
      action: async () => {
        const { error } = await supabase.from("diary_entries").delete().eq("id", editingId);
        if (!error) {
          setShowModal(false);
          fetchEntriesAndProfile();
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'blue': return { text: 'text-blue-400', bg: 'bg-blue-500', button: 'bg-blue-600 hover:bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', focus: 'focus:border-blue-500' };
      case 'purple': return { text: 'text-purple-400', bg: 'bg-purple-500', button: 'bg-purple-600 hover:bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', focus: 'focus:border-purple-500' };
      case 'rose': return { text: 'text-rose-400', bg: 'bg-rose-500', button: 'bg-rose-600 hover:bg-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', focus: 'focus:border-rose-500' };
      case 'amber': return { text: 'text-amber-400', bg: 'bg-amber-500', button: 'bg-amber-600 hover:bg-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', focus: 'focus:border-amber-500' };
      default: return { text: 'text-emerald-400', bg: 'bg-emerald-500', button: 'bg-emerald-600 hover:bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', focus: 'focus:border-emerald-500' };
    }
  };

  const theme = getThemeClasses(profile?.theme_color);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = (entry.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (entry.content || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = filterMood === "All" || entry.mood === filterMood;
    return matchesSearch && matchesMood;
  });

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

      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dashboard" className={`text-xs font-mono text-zinc-400 hover:${theme.text} mb-4 inline-flex items-center gap-2 transition-colors`}>
              <span>←</span> RETURN TO COMMAND CENTER
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight">Personal Log</h1>
            <p className="text-zinc-400 mt-1">Encrypted journal for operator thoughts and records.</p>
          </div>

          <button 
            onClick={openNewEntry}
            className={`${theme.button} text-zinc-950 font-bold py-3 px-8 rounded-lg transition-all ${theme.glow} tracking-wide flex items-center gap-2`}
          >
            <span>+</span> Initialize Log
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input 
            type="text"
            placeholder="Search records by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-4 outline-none text-white ${theme.focus} transition-all shadow-lg`}
          />
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className={`bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-4 outline-none text-white appearance-none cursor-pointer ${theme.focus} transition-all shadow-lg min-w-[200px]`}
          >
            <option value="All">All Statuses</option>
            {MOODS.map(m => (
              <option key={m.label} value={m.label}>{m.emoji} {m.label}</option>
            ))}
          </select>
        </div>

        {filteredEntries.length === 0 && !loading ? (
          <div className="text-center py-32 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/60 backdrop-blur-md">
            <div className="text-5xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
            <p className="text-zinc-400 max-w-sm mx-auto">
              Either the databanks are empty, or no records match your current search parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntries.map((entry) => {
              const moodData = MOODS.find(m => m.label === entry.mood) || MOODS[5];

              return (
                <div 
                  key={entry.id} 
                  onClick={() => openEditEntry(entry)}
                  className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 hover:border-zinc-500 transition-all cursor-pointer flex flex-col h-72 shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-white leading-tight line-clamp-1 flex-1 pr-4">
                      {entry.title || "Untitled Record"}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${moodData.color}`}>
                      <span>{moodData.emoji}</span> {moodData.label}
                    </div>
                  </div>
                  
                  <p className="text-xs font-mono text-zinc-400 mb-4 pb-4 border-b border-zinc-800/50 tracking-wider uppercase">
                    {formatDate(entry.created_at)}
                  </p>
                  
                  <div className="text-zinc-300 text-sm leading-relaxed overflow-hidden flex-1 relative">
                    <p className="whitespace-pre-wrap line-clamp-5">{entry.content}</p>
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-zinc-900/90 to-transparent"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl my-8 flex flex-col h-[90vh]">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl shrink-0">
                <h2 className={`text-xl font-bold font-mono tracking-tighter italic uppercase ${theme.text}`}>
                  {isEditing ? "Modify Encrypted Record" : "New Encrypted Record"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
              </div>

              <form onSubmit={saveEntry} className="flex flex-col flex-1 overflow-hidden p-6">
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-transparent text-3xl font-bold text-white placeholder-zinc-700 outline-none mb-6 ${theme.focus}`} placeholder="Record Title..." />

                <div className="mb-6 shrink-0">
                  <label className="block text-xs font-mono text-zinc-500 mb-3 tracking-widest">OPERATOR STATUS</label>
                  <div className="flex flex-wrap gap-3">
                    {MOODS.map(m => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setMood(m.label)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${
                          mood === m.label ? m.color : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        <span>{m.emoji}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-xs font-mono text-zinc-500 mb-2 tracking-widest">LOG DATA</label>
                  <textarea required value={content} onChange={(e) => setContent(e.target.value)} className={`w-full flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 outline-none transition-all text-zinc-200 resize-none leading-relaxed ${theme.focus}`} placeholder="Input thoughts, study notes, or daily reflections here..." />
                </div>

                <div className="flex gap-4 pt-6 mt-4 shrink-0">
                  {isEditing && (
                    <button type="button" onClick={deleteEntry} className="px-6 py-3 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 font-bold transition-all text-sm">ERASE LOG</button>
                  )}
                  <div className="flex-1"></div>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold transition-all text-sm">CANCEL</button>
                  <button type="submit" className={`px-8 py-3 rounded-xl ${theme.button} text-zinc-950 font-black tracking-widest transition-all text-sm ${theme.glow}`}>
                    {isEditing ? "UPDATE LOG" : "ENCRYPT & SAVE"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- CUSTOM CONFIRM MODAL ---------------- */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-center p-6 relative">
              <div className={`absolute top-0 left-0 w-full h-1 ${theme.bg}`}></div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 bg-zinc-900`}>
                <span className={`text-2xl ${theme.text}`}>⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white font-mono tracking-tighter mb-2">SYSTEM WARNING</h2>
              <p className="text-zinc-400 text-sm mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(null)} 
                  className="flex-1 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-900 border border-zinc-800 font-bold transition-all text-sm"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.action();
                    setConfirmDialog(null);
                  }} 
                  className={`flex-1 px-4 py-3 rounded-lg ${theme.button} text-zinc-950 font-black tracking-widest transition-all text-sm ${theme.glow}`}
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}