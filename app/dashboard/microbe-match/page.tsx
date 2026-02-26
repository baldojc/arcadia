"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MICROBES = ['🔬', '🩸', '🧬', '🧫', '💊', '💉', '🦠', '🌡️'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MicrobeMatchPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [themeName, setThemeName] = useState("emerald");
  const [bg, setBg] = useState("");

  // Initialize Game & Theme on Load
  useEffect(() => {
    setThemeName(localStorage.getItem("dailyju_theme") || "emerald");
    setBg(localStorage.getItem("dailyju_bg") || "");
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...MICROBES, ...MICROBES]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
  };

  const handleCardClick = (id: number) => {
    // Prevent clicking if 2 cards are already flipped, or if card is already matched/flipped
    if (flippedCards.length === 2) return;
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip the card
    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    // Check for match
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const card1 = newCards.find(c => c.id === newFlipped[0]);
      const card2 = newCards.find(c => c.id === newFlipped[1]);

      if (card1?.emoji === card2?.emoji) {
        // MATCH FOUND
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === card1?.id || c.id === card2?.id ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setMatches(m => m + 1);
        }, 500);
      } else {
        // NO MATCH - FLIP BACK
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === card1?.id || c.id === card2?.id ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const getThemeClasses = (t: string) => {
    switch (t) {
      case 'blue': return { text: 'text-blue-400', bg: 'bg-blue-500', button: 'bg-blue-600 hover:bg-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', border: 'border-blue-500/30' };
      case 'purple': return { text: 'text-purple-400', bg: 'bg-purple-500', button: 'bg-purple-600 hover:bg-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', border: 'border-purple-500/30' };
      case 'rose': return { text: 'text-rose-400', bg: 'bg-rose-500', button: 'bg-rose-600 hover:bg-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]', border: 'border-rose-500/30' };
      case 'amber': return { text: 'text-amber-400', bg: 'bg-amber-500', button: 'bg-amber-600 hover:bg-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', border: 'border-amber-500/30' };
      default: return { text: 'text-emerald-400', bg: 'bg-emerald-500', button: 'bg-emerald-600 hover:bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', border: 'border-emerald-500/30' };
    }
  };

  const theme = getThemeClasses(themeName);
  const isGameWon = matches === 8;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans relative flex flex-col p-4 md:p-8">
      
      {bg && (
        <>
          <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-center bg-no-repeat fixed" style={{ backgroundImage: `url(${bg})` }} />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent fixed pointer-events-none" />
        </>
      )}

      <div className="relative z-10 max-w-3xl mx-auto w-full flex-1 flex flex-col">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dashboard" className={`text-xs font-mono text-zinc-400 hover:${theme.text} mb-4 inline-flex items-center gap-2 transition-colors`}>
              <span>←</span> RETURN TO COMMAND CENTER
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              Microbe Match <span className="text-3xl">🧫</span>
            </h1>
            <p className="text-zinc-400 mt-1">Memory calibration and decompression protocol.</p>
          </div>

          <div className="flex gap-4 font-mono text-sm">
            <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-lg">
              <span className="text-zinc-500">MOVES:</span> <span className={theme.text}>{moves}</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-lg">
              <span className="text-zinc-500">MATCHES:</span> <span className={theme.text}>{matches}/8</span>
            </div>
          </div>
        </div>

        {/* GAME BOARD */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {isGameWon ? (
            <div className="text-center bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-10 rounded-2xl shadow-2xl animate-fade-in w-full max-w-md">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className={`text-2xl font-black tracking-wider uppercase mb-2 ${theme.text}`}>Optimal Memory Achieved</h2>
              <p className="text-zinc-400 mb-8">Simulation completed in {moves} moves.</p>
              <button 
                onClick={initializeGame} 
                className={`w-full py-4 rounded-xl ${theme.button} text-zinc-950 font-black tracking-widest transition-all ${theme.glow}`}
              >
                RESTART MODULE
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-md">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isFlipped || card.isMatched}
                  className={`relative w-full aspect-square rounded-xl sm:rounded-2xl transition-all duration-300 transform outline-none shadow-lg
                    ${card.isMatched ? `bg-zinc-950 border border-zinc-800 opacity-50 scale-95 cursor-default` : 
                      card.isFlipped ? `bg-zinc-800 border ${theme.border} scale-105 shadow-xl` : 
                      `bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:-translate-y-1`}
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl transition-opacity duration-300">
                    <span className={card.isFlipped || card.isMatched ? "opacity-100 scale-100 transition-transform duration-300" : "opacity-0 scale-50"}>
                      {card.emoji}
                    </span>
                    <span className={`absolute inset-0 flex items-center justify-center opacity-10 font-black text-2xl ${theme.text} ${card.isFlipped || card.isMatched ? "hidden" : "block"}`}>
                      ?
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* FOOTER ACTIONS */}
        {!isGameWon && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={initializeGame} 
              className="text-xs font-bold tracking-widest font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-6 py-2 rounded-lg transition-all"
            >
              RESET SIMULATION
            </button>
          </div>
        )}

      </div>
    </div>
  );
}