"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

type Player = 'X' | 'O' | null;

export default function NeonGridPage() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  
  const [themeName, setThemeName] = useState("emerald");
  const [bg, setBg] = useState("");
  const [profile, setProfile] = useState<any>(null);
  
  // 1. ADDED LOADING STATE
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
      
      setThemeName(localStorage.getItem("dailyju_theme") || "emerald");
      setBg(localStorage.getItem("dailyju_bg") || "");
      
      // 2. TURN OFF LOADING ONCE DATA IS FETCHED
      setIsLoading(false);
    };
    
    fetchProfile();
  }, []);

  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]            
  ];

  const checkWinner = (squares: Player[]) => {
    for (let i = 0; i < WIN_LINES.length; i++) {
      const [a, b, c] = WIN_LINES[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner]);

  const makeAIMove = () => {
    const newBoard = [...board];
    let move = findWinningMove(newBoard, 'O');
    if (move === null) move = findWinningMove(newBoard, 'X');
    if (move === null && newBoard[4] === null) move = 4;
    if (move === null) {
      const available = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
      move = available[Math.floor(Math.random() * available.length)];
    }

    if (move !== null) {
      newBoard[move] = 'O';
      setBoard(newBoard);
      const newWinner = checkWinner(newBoard);
      if (newWinner) {
        setWinner(newWinner);
      } else {
        setIsPlayerTurn(true);
      }
    }
  };

  const findWinningMove = (squares: Player[], player: Player) => {
    for (let i = 0; i < WIN_LINES.length; i++) {
      const [a, b, c] = WIN_LINES[i];
      if (squares[a] === player && squares[b] === player && squares[c] === null) return c;
      if (squares[a] === player && squares[c] === player && squares[b] === null) return b;
      if (squares[b] === player && squares[c] === player && squares[a] === null) return a;
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    } else {
      setIsPlayerTurn(false);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
  };

  const getThemeClasses = (t: string) => {
    switch (t) {
      case 'blue': return { text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]', border: 'border-blue-500/50' };
      case 'purple': return { text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)] drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]', border: 'border-purple-500/50' };
      case 'rose': return { text: 'text-rose-400', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.6)] drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]', border: 'border-rose-500/50' };
      case 'amber': return { text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)] drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]', border: 'border-amber-500/50' };
      default: return { text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)] drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]', border: 'border-emerald-500/50' };
    }
  };

  const theme = getThemeClasses(themeName);
  const playerName = profile?.display_name ? profile.display_name.toUpperCase() : "OPERATOR";

  // 3. ADDED THE LOADING SCREEN OVERLAY
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-xs text-zinc-500 tracking-widest">
        <p className="animate-pulse">INITIALIZING MODULE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans relative flex flex-col p-4 md:p-8">
      
      {bg && (
        <>
          <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-center bg-no-repeat fixed" style={{ backgroundImage: `url(${bg})` }} />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent fixed pointer-events-none" />
        </>
      )}

      <div className="relative z-10 max-w-3xl mx-auto w-full flex-1 flex flex-col">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dashboard" className={`text-xs font-mono text-zinc-400 hover:${theme.text} mb-4 inline-flex items-center gap-2 transition-colors`}>
              <span>←</span> RETURN TO COMMAND CENTER
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              Neon Grid <span className="text-3xl">✖️</span>
            </h1>
            <p className="text-zinc-400 mt-1">Tactical logic simulation vs. System AI.</p>
          </div>

          <div className="flex gap-4 font-mono text-sm">
            <div className={`px-4 py-2 rounded-lg border ${isPlayerTurn && !winner ? `bg-zinc-800 ${theme.border} ${theme.text}` : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'} transition-all`}>
              {playerName} (X)
            </div>
            <div className={`px-4 py-2 rounded-lg border ${!isPlayerTurn && !winner ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'} transition-all`}>
              SYSTEM (O)
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          {winner && (
            <div className="absolute z-20 inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-3xl animate-fade-in">
              <div className="text-center p-8">
                <h2 className={`text-5xl font-black tracking-widest uppercase mb-6 drop-shadow-2xl ${winner === 'X' ? theme.text : winner === 'O' ? 'text-red-500' : 'text-zinc-400'}`}>
                  {winner === 'X' ? `${playerName} WINS` : winner === 'O' ? 'SYSTEM WINS' : 'STALEMATE'}
                </h2>
                <button 
                  onClick={resetGame} 
                  className="px-8 py-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-black tracking-widest transition-all"
                >
                  REBOOT SIMULATION
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[400px]">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || winner !== null || !isPlayerTurn}
                className={`relative w-full aspect-square rounded-2xl transition-all duration-300 transform outline-none flex items-center justify-center text-6xl sm:text-7xl font-black
                  ${!cell && isPlayerTurn && !winner ? 'bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 hover:-translate-y-1 cursor-pointer' : 'bg-zinc-900/40 border border-zinc-800 cursor-default'}
                  ${cell === 'X' ? `${theme.text} ${theme.glow} ${theme.border} bg-zinc-900` : ''}
                  ${cell === 'O' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] border-red-500/50 bg-zinc-900' : ''}
                `}
              >
                <span className={cell ? "animate-fade-in scale-100" : "scale-50 opacity-0"}>
                  {cell}
                </span>
              </button>
            ))}
          </div>

        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={resetGame} 
            className="text-xs font-bold tracking-widest font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-6 py-2 rounded-lg transition-all"
          >
            FORCE RESTART
          </button>
        </div>

      </div>
    </div>
  );
}