"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Romance", "Sci-Fi", "Slice of Life", "Thriller", "Horror", 
  "Mystery", "Isekai", "Mecha", "Sports", "Psychological"
];

const TABS = ["All", "Watching", "Completed", "On Hold", "Favorites"];

export default function AnimePage() {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [profile, setProfile] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [episodes, setEpisodes] = useState(12);
  const [status, setStatus] = useState("Watching");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ message: string, action: () => void } | null>(null);

  useEffect(() => {
    fetchAnimeAndProfile();
  }, []);

  const fetchAnimeAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("anime_vault").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setAnimeList(data);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData);
    }
    setLoading(false);
  };

  const openNewForm = () => {
    setIsEditing(false); setEditingId(null); setTitle(""); setEpisodes(12); setStatus("Watching"); setImageUrl(""); setSelectedGenres([]); setIsFavorite(false); setShowModal(true);
  };

  const openEditForm = (anime: any) => {
    setIsEditing(true); setEditingId(anime.id); setTitle(anime.title); setEpisodes(anime.total_episodes); setStatus(anime.status); setImageUrl(anime.image_url || ""); setSelectedGenres(anime.genres || []); setIsFavorite(anime.isFavorite || false); setShowModal(true);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const saveAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let finalCurrentEpisode = isEditing && editingId ? (animeList.find(a => a.id === editingId)?.current_episode || 0) : 0;
      if (status === "Completed") finalCurrentEpisode = episodes;

      const payload = { user_id: user.id, title, total_episodes: episodes, status, image_url: imageUrl, genres: selectedGenres, is_favorite: isFavorite, current_episode: finalCurrentEpisode };

      if (isEditing && editingId) {
        const { error } = await supabase.from("anime_vault").update(payload).eq("id", editingId);
        if (!error) { setShowModal(false); fetchAnimeAndProfile(); }
      } else {
        const { error } = await supabase.from("anime_vault").insert([payload]);
        if (!error) { setShowModal(false); fetchAnimeAndProfile(); }
      }
    }
  };

  const deleteAnime = () => {
    if (!editingId) return;
    setConfirmDialog({
      message: `Initiate deletion of "${title}"?`,
      action: async () => {
        const { error } = await supabase.from("anime_vault").delete().eq("id", editingId);
        if (!error) { 
          setShowModal(false); 
          fetchAnimeAndProfile(); 
        }
      }
    });
  };

  const adjustProgress = async (e: React.MouseEvent, id: string, current: number, delta: number, total: number) => {
    e.stopPropagation(); 
    const nextValue = current + delta;
    if (nextValue >= 0 && nextValue <= total) {
      const payload: any = { current_episode: nextValue };
      if (nextValue === total) payload.status = "Completed";
      else if (current === total && nextValue < total) payload.status = "Watching";
      const { error } = await supabase.from("anime_vault").update(payload).eq("id", id);
      if (!error) fetchAnimeAndProfile();
    }
  };

  const toggleQuickFavorite = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation(); 
    const { error } = await supabase.from("anime_vault").update({ is_favorite: !currentStatus }).eq("id", id);
    if (!error) fetchAnimeAndProfile();
  };

  const startQuiz = () => {
    if (animeList.length < 3) return alert("System requires at least 3 entries in the archive to generate a Memory Test.");
    const target = animeList[Math.floor(Math.random() * animeList.length)];
    const questionType = Math.floor(Math.random() * 4); 
    let question = "", options: string[] = [], answer = "";
    
    if (questionType === 0) {
      question = `What is your current watch status for "${target.title}"?`;
      options = ["Watching", "Completed", "On Hold", "Dropped"];
      answer = target.status;
    } else if (questionType === 1) {
      question = `How many total episodes are there in "${target.title}"?`;
      answer = target.total_episodes.toString();
      const fake1 = (target.total_episodes + 12).toString(), fake2 = (target.total_episodes > 12 ? target.total_episodes - 12 : 24).toString(), fake3 = Math.floor(Math.random() * 50 + 1).toString();
      options = Array.from(new Set([answer, fake1, fake2, fake3, "12", "24"])).slice(0, 4).sort(() => Math.random() - 0.5);
    } else if (questionType === 2) {
      question = `Is "${target.title}" marked as a Favorite (⭐) in your databanks?`;
      options = ["Yes", "No"];
      answer = target.is_favorite ? "Yes" : "No";
    } else {
      if (target.genres && target.genres.length > 0) {
        question = `Which of these genres is officially associated with "${target.title}"?`;
        answer = target.genres[Math.floor(Math.random() * target.genres.length)];
        const wrongGenres = GENRES.filter(g => !target.genres.includes(g)).sort(() => Math.random() - 0.5).slice(0, 3);
        options = [answer, ...wrongGenres].sort(() => Math.random() - 0.5);
      } else {
        question = `What is your current watch status for "${target.title}"?`;
        options = ["Watching", "Completed", "On Hold", "Dropped"];
        answer = target.status;
      }
    }
    setQuiz({ question, options, answer, result: null });
    setShowQuiz(true);
  };

  const handleQuizAnswer = (selected: string) => {
    if (selected === quiz.answer) setQuiz({ ...quiz, result: "CORRECT! Operator memory is optimal." });
    else setQuiz({ ...quiz, result: `INCORRECT. The correct data is: ${quiz.answer}` });
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'blue': return { text: 'text-blue-400', bg: 'bg-blue-500', button: 'bg-blue-600 hover:bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', bar: 'bg-blue-500' };
      case 'purple': return { text: 'text-purple-400', bg: 'bg-purple-500', button: 'bg-purple-600 hover:bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', bar: 'bg-purple-500' };
      case 'rose': return { text: 'text-rose-400', bg: 'bg-rose-500', button: 'bg-rose-600 hover:bg-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', bar: 'bg-rose-500' };
      case 'amber': return { text: 'text-amber-400', bg: 'bg-amber-500', button: 'bg-amber-600 hover:bg-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', bar: 'bg-amber-500' };
      default: return { text: 'text-emerald-400', bg: 'bg-emerald-500', button: 'bg-emerald-600 hover:bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', bar: 'bg-emerald-500' };
    }
  };

  const theme = getThemeClasses(profile?.theme_color);
  const filteredList = animeList.filter(anime => {
    if (activeTab === "All") return true;
    if (activeTab === "Favorites") return anime.is_favorite;
    return anime.status === activeTab;
  });

  // --- ADDED LOADING OVERLAY ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-xs text-zinc-500 tracking-widest">
        <p className="animate-pulse">INITIALIZING MODULE...</p>
      </div>
    );
  }

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

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dashboard" className={`text-xs font-mono text-zinc-400 hover:${theme.text} mb-4 inline-flex items-center gap-2 transition-colors`}>
              <span>←</span> RETURN TO COMMAND CENTER
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight">Visual Archive</h1>
            <p className="text-zinc-400 mt-1">Manage and track your entertainment data.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={startQuiz} className={`bg-zinc-900 hover:bg-zinc-800 ${theme.text} border border-zinc-700 font-bold py-2.5 px-6 rounded-lg transition-all text-sm tracking-wide flex items-center gap-2`}>
              <span className="text-lg">🧠</span> Memory Test
            </button>
            <button onClick={openNewForm} className={`${theme.button} text-zinc-950 font-bold py-2.5 px-6 rounded-lg transition-all ${theme.glow} text-sm tracking-wide`}>
              + New Entry
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-zinc-800 text-white border border-zinc-600" : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"}`}>
              {tab === "Favorites" ? "⭐ " : ""}{tab}
            </button>
          ))}
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/60 backdrop-blur-md">
            <div className="text-5xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
            <p className="text-zinc-400 max-w-sm mx-auto">There are no entries in this category. Click "New Entry" to update the archive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredList.map((anime) => (
              <div key={anime.id} onClick={() => openEditForm(anime)} className="group relative bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer flex flex-col h-full shadow-lg">
                <div className="h-56 w-full bg-zinc-800 relative overflow-hidden">
                  {anime.image_url ? <img src={anime.image_url} alt={anime.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-2xl font-black uppercase italic bg-zinc-900">NO SIGNAL</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <button onClick={(e) => toggleQuickFavorite(e, anime.id, anime.is_favorite)} className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 transition-all"><span className={`text-lg ${anime.is_favorite ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "text-zinc-500 grayscale"}`}>⭐</span></button>
                  <span className={`absolute bottom-3 left-4 text-xs font-bold tracking-wider px-2.5 py-1 rounded bg-zinc-900/80 backdrop-blur-md ${theme.text} border border-zinc-700`}>{anime.status.toUpperCase()}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-white leading-tight mb-2 line-clamp-2">{anime.title}</h3>
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {anime.genres.slice(0, 3).map((g: string) => <span key={g} className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-sm">{g}</span>)}
                      {anime.genres.length > 3 && <span className="text-[10px] text-zinc-500 px-1">+{anime.genres.length - 3}</span>}
                    </div>
                  )}
                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-xs text-zinc-400 font-mono">
                      <span>DATABANKS</span>
                      <span className={theme.text}>{anime.current_episode} / {anime.total_episodes} EP</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`${theme.bar} h-full transition-all duration-500`} style={{ width: `${(anime.current_episode / anime.total_episodes) * 100}%` }} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={(e) => adjustProgress(e, anime.id, anime.current_episode, -1, anime.total_episodes)} className="w-10 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition-colors text-zinc-400 flex items-center justify-center">-</button>
                      <button onClick={(e) => adjustProgress(e, anime.id, anime.current_episode, 1, anime.total_episodes)} className={`flex-1 py-2 rounded bg-zinc-900 border border-zinc-700 hover:border-zinc-500 ${theme.text} text-xs font-bold tracking-widest transition-colors`}>+ LOG EPISODE</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl my-8">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl">
                <h2 className={`text-xl font-bold font-mono tracking-tighter italic uppercase ${theme.text}`}>{isEditing ? "Modify Archive Entry" : "Initialize New Series"}</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
              </div>
              <div className="p-6">
                <form onSubmit={saveAnime} className="space-y-5">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">SERIES TITLE</label>
                      <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white" placeholder="e.g., Solo Leveling" />
                    </div>
                    <button type="button" onClick={() => setIsFavorite(!isFavorite)} className={`h-[50px] px-4 rounded-lg border transition-all flex items-center gap-2 ${isFavorite ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-zinc-900 border-zinc-700 text-zinc-500"}`}><span className="text-xl">⭐</span></button>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">POSTER URL (OPTIONAL)</label>
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white" placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">TOTAL EPISODES</label>
                      <input type="number" required value={episodes} onChange={(e) => setEpisodes(parseInt(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-1.5 tracking-widest">STATUS</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none appearance-none text-white cursor-pointer">
                        <option>Watching</option><option>Completed</option><option>On Hold</option><option>Dropped</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2 tracking-widest">CATEGORIZATION (GENRES)</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                      {GENRES.map(genre => (
                        <button key={genre} type="button" onClick={() => toggleGenre(genre)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedGenres.includes(genre) ? `${theme.button} text-zinc-950 ${theme.glow}` : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>{genre}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6 border-t border-zinc-800 mt-6">
                    {isEditing && <button type="button" onClick={deleteAnime} className="px-4 py-3 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 font-bold transition-all text-sm">DELETE</button>}
                    <div className="flex-1"></div>
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 font-bold transition-all text-sm">CANCEL</button>
                    <button type="submit" className={`px-8 py-3 rounded-lg ${theme.button} text-zinc-950 font-black tracking-widest transition-all text-sm ${theme.glow}`}>{isEditing ? "UPDATE" : "SAVE"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showQuiz && quiz && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className={`bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${theme.bar}`}></div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">Memory Test</h2>
              <p className="text-zinc-400 text-sm mb-8 font-mono">Verifying Operator Knowledge...</p>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-6 shadow-inner">
                <p className={`text-lg ${theme.text} font-medium`}>{quiz.question}</p>
              </div>
              {!quiz.result ? (
                <div className="grid grid-cols-2 gap-3">
                  {quiz.options.map((opt: string) => (
                    <button key={opt} onClick={() => handleQuizAnswer(opt)} className={`bg-zinc-800 hover:bg-zinc-700 hover:${theme.text} border border-zinc-700 p-4 rounded-xl font-bold transition-all`}>{opt}</button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-6 rounded-xl border ${quiz.result.includes("CORRECT") ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-red-500/10 border-red-500 text-red-400"}`}>
                    <p className="font-black text-xl mb-1">{quiz.result.includes("CORRECT") ? "ACCESS GRANTED" : "ACCESS DENIED"}</p>
                    <p className="text-sm">{quiz.result}</p>
                  </div>
                  <button onClick={() => setShowQuiz(false)} className="w-full bg-zinc-100 text-zinc-950 font-bold py-3 rounded-lg hover:bg-white transition-colors">CLOSE TERMINAL</button>
                </div>
              )}
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