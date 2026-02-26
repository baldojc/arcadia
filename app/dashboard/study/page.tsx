"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

const CATEGORIES = [
  "Hematology", "Microbiology", "Clinical Chemistry", 
  "Immunology", "Parasitology", "General Study", "Other"
];

// PRE-LOADED SAFE AUDIO FILES (100% Free & Hosted by Google)
const ALARM_SOUNDS = [
  { name: "Digital Watch", url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" },
  { name: "Soft Beep", url: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" },
  { name: "Gentle Marimba", url: "https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg" },
  { name: "Space Ripple", url: "https://actions.google.com/sounds/v1/science_fiction/space_ripple.ogg" }
];

export default function StudyPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Hematology");
  const [customCategory, setCustomCategory] = useState(""); 
  const [xpReward, setXpReward] = useState(50);
  const [dueDate, setDueDate] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const [focusQuest, setFocusQuest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [focusNotes, setFocusNotes] = useState("");
  const [completedSessions, setCompletedSessions] = useState(0);

  const [alarmSound, setAlarmSound] = useState(ALARM_SOUNDS[0].url);

  // CUSTOM CONFIRM MODAL STATE
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, action: () => void } | null>(null);

  const today = new Date();
  const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  useEffect(() => {
    fetchQuestsAndProfile();
    const savedSound = localStorage.getItem("dailyju_alarm");
    if (savedSound) setAlarmSound(savedSound);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => { setTimeLeft((time) => time - 1); }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      const audio = new Audio(alarmSound);
      audio.volume = 0.5; 
      audio.play().catch(e => console.log("Audio blocked by browser:", e));

      if (!isBreak) {
        setCompletedSessions((prev) => prev + 1);
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, alarmSound]);

  const handleSoundPreview = (url: string) => {
    setAlarmSound(url);
    localStorage.setItem("dailyju_alarm", url);
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(e => console.log(e));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchQuestsAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("medtech_quests")
        .select("*")
        .eq("user_id", user.id)
        .order("is_completed", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (data) setQuests(data);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (profileData) setProfile(profileData);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setTitle("");
    setCategory("Hematology");
    setCustomCategory("");
    setXpReward(50);
    setDueDate("");
    setResourceUrl("");
    setShowModal(true);
  };

  const addQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const finalCategory = category === "Other" ? (customCategory || "Uncategorized") : category;

      const payload = { 
        user_id: user.id, title, category: finalCategory, xp_reward: xpReward, is_completed: false, 
        due_date: dueDate ? new Date(dueDate).toISOString() : null, resource_url: resourceUrl
      };
      const { error } = await supabase.from("medtech_quests").insert([payload]);
      if (!error) {
        setShowModal(false);
        fetchQuestsAndProfile();
      }
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean, xp: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: questError } = await supabase.from("medtech_quests").update({ is_completed: !currentStatus }).eq("id", id);
      if (!currentStatus && !questError) {
        const { data: profileData } = await supabase.from("profiles").select("current_xp").eq("id", user.id).single();
        if (profileData) {
          await supabase.from("profiles").update({ current_xp: profileData.current_xp + xp }).eq("id", user.id);
        }
      }
      if (!questError) fetchQuestsAndProfile();
    }
  };

  // UPDATED TO USE THE CUSTOM MODAL INSTEAD OF WINDOW.CONFIRM
  const deleteQuest = (id: string) => {
    setConfirmDialog({
      message: "Delete this objective permanently?",
      action: async () => {
        const { error } = await supabase.from("medtech_quests").delete().eq("id", id);
        if (!error) fetchQuestsAndProfile();
      }
    });
  };

  const saveFocusNotes = async () => {
    if (focusQuest) {
      const { error } = await supabase.from("medtech_quests").update({ study_notes: focusNotes }).eq("id", focusQuest.id);
      if (!error) fetchQuestsAndProfile();
    }
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const activeQuests = quests.filter(q => !q.is_completed);
  const completedQuests = quests.filter(q => q.is_completed);

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

      {!focusQuest ? (
        <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-zinc-800 pb-6">
            <div>
              <Link href="/dashboard" className={`text-xs font-mono text-zinc-400 hover:${theme.text} mb-4 inline-flex items-center gap-2 transition-colors`}>
                <span>←</span> RETURN TO COMMAND CENTER
              </Link>
              <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                Study Operations <span className={`${theme.text} text-3xl`}>🧬</span>
              </h1>
              <p className="text-zinc-400 mt-1">Manage tasks, timelines, and deep focus sessions.</p>
            </div>

            <button onClick={openNewModal} className={`${theme.button} text-zinc-950 font-bold py-3 px-8 rounded-lg transition-all ${theme.glow} tracking-wide flex items-center gap-2`}>
              <span>+</span> Assign Objective
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 tracking-wider uppercase font-mono flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`}></span>
                Active Directives
              </h2>
              
              <div className="space-y-4">
                {activeQuests.length === 0 && !loading && (
                  <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/40 backdrop-blur-md text-zinc-400 text-sm">
                    All objectives complete. Awaiting new directives.
                  </div>
                )}
                {activeQuests.map(quest => (
                  <div key={quest.id} className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-500 transition-all shadow-lg">
                    <div className="flex gap-4 items-start">
                      <button onClick={() => toggleComplete(quest.id, quest.is_completed, quest.xp_reward)} className={`w-6 h-6 rounded border-2 border-zinc-600 hover:border-zinc-400 flex-shrink-0 transition-all mt-1`} />
                      <div className="flex-1">
                        <h3 className="font-bold text-white leading-tight mb-1">{quest.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs font-mono text-zinc-400 mt-2">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{quest.category}</span>
                          <span className={theme.text}>+{quest.xp_reward} XP</span>
                          {quest.due_date && <span className="text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded">🎯 {formatDueDate(quest.due_date)}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteQuest(quest.id)} className="text-zinc-600 hover:text-red-400 text-xl transition-colors">×</button>
                    </div>
                    
                    <button onClick={() => { setFocusQuest(quest); setFocusNotes(quest.study_notes || ""); setTimeLeft(25 * 60); setIsActive(false); setIsBreak(false); setCompletedSessions(0); }} className={`w-full mt-2 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 ${theme.text} text-xs font-bold tracking-widest transition-colors flex justify-center items-center gap-2`}>
                      <span>⏱️</span> ENTER FOCUS MODE
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-500 mb-4 tracking-wider uppercase font-mono">Cleared Data</h2>
              <div className="space-y-4 opacity-70">
                {completedQuests.map(quest => (
                  <div key={quest.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-5 flex gap-4 items-start">
                    <button onClick={() => toggleComplete(quest.id, quest.is_completed, quest.xp_reward)} className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all mt-1 border ${theme.text}`}>✓</button>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-400 leading-tight mb-1 line-through">{quest.title}</h3>
                      <div className="flex gap-3 text-xs font-mono text-zinc-500"><span>{quest.category}</span></div>
                    </div>
                    <button onClick={() => deleteQuest(quest.id)} className="text-zinc-700 hover:text-red-400 text-xl transition-colors">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-50 flex flex-col p-4 md:p-8 overflow-y-auto bg-zinc-950/90 backdrop-blur-xl h-screen">
          <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto w-full">
            <button onClick={() => { saveFocusNotes(); setFocusQuest(null); }} className="text-zinc-400 hover:text-white font-mono text-sm flex items-center gap-2 transition-colors">← ABORT SESSION</button>
            <div className={`${theme.text} font-mono text-sm tracking-widest border border-zinc-700 px-3 py-1 rounded-full bg-zinc-900 animate-pulse`}>SYSTEM: FOCUS MODE ENGAGED</div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono text-xs mb-3 inline-block">{focusQuest.category}</span>
                <h2 className="text-2xl font-bold text-white leading-tight mb-4">{focusQuest.title}</h2>
                {focusQuest.resource_url ? (
                  <a href={focusQuest.resource_url} target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center text-sm font-bold tracking-widest transition-colors">🔗 OPEN STUDY MATERIAL</a>
                ) : (
                  <div className="block w-full py-3 rounded-lg bg-zinc-950 border border-dashed border-zinc-800 text-zinc-600 text-center text-sm font-mono italic">NO RESOURCE LINK ATTACHED</div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center flex-1 shadow-xl">
                <div className="text-sm font-mono text-zinc-500 mb-2 tracking-widest">{isBreak ? "REST PERIOD" : "OPTIMAL FOCUS"}</div>
                <div className={`text-xs font-mono mb-6 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 ${theme.text}`}>COMPLETED SESSIONS: {completedSessions}</div>
                <div className={`text-8xl md:text-9xl font-black font-mono tracking-tighter mb-8 ${isBreak ? "text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" : `${theme.text} ${theme.glow}`}`}>{formatTime(timeLeft)}</div>
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  <button onClick={() => setIsActive(!isActive)} className={`flex-[2] py-4 rounded-xl font-black tracking-widest transition-all ${isActive ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : `${theme.button} text-zinc-950 ${theme.glow}`}`}>{isActive ? "PAUSE" : "START"}</button>
                  <button onClick={() => { setTimeLeft(25 * 60); setIsBreak(false); setIsActive(false); }} className="flex-1 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm transition-colors">25:00</button>
                  <button onClick={() => { setTimeLeft(5 * 60); setIsBreak(true); setIsActive(false); }} className="flex-1 py-4 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-sm transition-colors">05:00</button>
                </div>
                
                {/* ALARM SELECTOR */}
                <div className="mt-8 w-full pt-6 border-t border-zinc-800">
                  <label className="block text-[10px] font-mono text-zinc-500 mb-2 tracking-widest text-center">ALARM TONE (PREVIEWS ON SELECT)</label>
                  <select 
                    value={alarmSound}
                    onChange={(e) => handleSoundPreview(e.target.value)}
                    className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none text-zinc-300 appearance-none cursor-pointer text-center text-sm font-mono ${theme.focus} transition-all`}
                  >
                    {ALARM_SOUNDS.map(s => <option key={s.name} value={s.url}>{s.name}</option>)}
                  </select>
                </div>

              </div>
            </div>
            
            <div className="lg:col-span-7 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-full min-h-[500px] shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                <h3 className={`${theme.text} font-mono tracking-widest flex items-center gap-2`}><span>{">"}</span> TACTICAL SCRATCHPAD</h3>
                <button onClick={saveFocusNotes} className={`text-xs font-bold border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-3 py-1.5 rounded transition-all`}>SAVE NOTES</button>
              </div>
              <textarea value={focusNotes} onChange={(e) => setFocusNotes(e.target.value)} onBlur={saveFocusNotes} className="flex-1 w-full bg-transparent resize-none outline-none text-zinc-300 font-mono text-sm leading-relaxed" placeholder="Jot down quick memorization facts..." />
              <button onClick={() => { toggleComplete(focusQuest.id, focusQuest.is_completed, focusQuest.xp_reward); setFocusQuest(null); }} className={`mt-6 w-full bg-zinc-800 text-zinc-400 hover:text-white font-black tracking-widest py-5 rounded-xl transition-all border border-zinc-700 shadow-lg`}>✓ MARK OBJECTIVE COMPLETE (+{focusQuest.xp_reward} XP)</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD QUEST MODAL ---------------- */}
      {showModal && !focusQuest && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <h2 className={`text-xl font-bold font-mono tracking-tighter italic uppercase ${theme.text}`}>Assign Objective</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
            </div>
            <form onSubmit={addQuest} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">OBJECTIVE TITLE</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white ${theme.focus} transition-all`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">CATEGORY</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white appearance-none cursor-pointer ${theme.focus} transition-all`}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  
                  {category === "Other" && (
                    <input 
                      required 
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)} 
                      className={`w-full mt-3 bg-zinc-950 border border-zinc-700 rounded-lg p-3 outline-none text-white ${theme.focus} transition-all`} 
                      placeholder="Type custom category..." 
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">XP REWARD</label>
                  <input type="number" required value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value))} className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white ${theme.focus} transition-all`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">TARGET DATE</label>
                <input 
                  type="date" 
                  min={todayString} 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-zinc-300 cursor-pointer ${theme.focus} transition-all`} 
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">RESOURCE LINK (OPTIONAL)</label>
                <input type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white ${theme.focus} transition-all`} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 font-bold transition-all text-sm">ABORT</button>
                <button type="submit" className={`flex-[2] px-4 py-3 rounded-lg ${theme.button} text-zinc-950 font-black tracking-widest transition-all text-sm ${theme.glow}`}>ASSIGN</button>
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
  );
}