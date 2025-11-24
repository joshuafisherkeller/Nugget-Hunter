
import React from 'react';
import { GameState, GameAssets } from '../types';
import { BOSS_HITS_REQUIRED } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  bossHp: number;
  timeLeft: number;
  assets: GameAssets | null;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  score, 
  bossHp, 
  timeLeft,
  assets, 
  onStart,
  onRestart 
}) => {
  
  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans overflow-hidden">
      
      {/* HUD - Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex flex-col items-center pt-2 z-10">
         <div className="text-white/90 text-sm font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
            NISPY PRESENTS A 15 MINUTE APPLE GAME
         </div>
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 text-3xl font-black italic tracking-tighter drop-shadow-lg">
            NUGGET HUNT
        </h1>
      </div>

      {/* HUD - Score */}
      {(gameState === GameState.PLAYING || gameState === GameState.BOSS_FIGHT) && (
        <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-white font-bold shadow-xl">
          <div className="text-xs text-gray-300 uppercase">Score</div>
          <div className="text-2xl text-yellow-400 animate-pulse">{score}</div>
        </div>
      )}

      {/* HUD - Boss Health */}
      {gameState === GameState.BOSS_FIGHT && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-80 animate-bounce-slight">
          <div className="flex justify-between text-white text-xs font-bold mb-1 px-1">
            <span className="text-red-500 drop-shadow-md">MEGA PIERRE</span>
          </div>
          <div className="h-6 bg-gray-900 rounded-full border-2 border-red-900 overflow-hidden relative shadow-[0_0_15px_rgba(255,0,0,0.5)]">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 transition-all duration-200 relative"
              style={{ width: `${(bossHp / BOSS_HITS_REQUIRED) * 100}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto z-50">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-gray-700 shadow-2xl flex flex-col items-center max-w-md mx-4 text-center transform hover:scale-105 transition-transform duration-500">
              <h1 className="text-5xl font-black text-white mb-2 text-center uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600">Nugget Hunt</h1>
              <div className="h-1 w-20 bg-red-500 rounded mb-6"></div>
              
              <p className="text-gray-300 mb-6 text-center leading-relaxed font-medium">
                Welcome to nugget hunt! Get dem nuggets! Use your crossbow armed with digital bananas and apples to defeat the Mega Pierre nugget.<br/>
                <span className="text-sm text-yellow-400 mt-2 block font-bold">
                   TIP: Destroy 200 nuggets in waves to reach the Boss!
                </span>
              </p>

              <button 
                onClick={onStart}
                className="group relative px-10 py-5 bg-red-600 rounded-full text-white font-black text-xl tracking-wider overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(220,38,38,0.9)] transition-all active:scale-95"
              >
                <span className="relative z-10">START RAMPAGE</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
          </div>
        </div>
      )}

      {/* Boss Intro */}
      {gameState === GameState.BOSS_INTRO && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/60 z-40 backdrop-blur-sm">
          <div className="transform rotate-[-2deg] bg-gradient-to-br from-red-600 to-red-900 text-white p-10 border-4 border-yellow-400 shadow-[0_0_50px_rgba(255,0,0,0.8)] animate-bounce max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center leading-tight drop-shadow-lg">
              MEGA PIERRE<br/>FACE NUGGET INCOMING
            </h1>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 pointer-events-auto z-50 animate-fade-in">
             <h1 className="text-7xl md:text-9xl font-black text-red-600 tracking-tighter mb-4 drop-shadow-[0_0_35px_rgba(220,38,38,0.9)] animate-pulse">
                 YOU DIED
             </h1>
             <p className="text-gray-400 mb-8 text-2xl font-mono">Total Score: {score}</p>
             <button 
              onClick={onRestart}
              className="px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)] uppercase"
            >
              Try my luck again
            </button>
         </div>
      )}

      {/* Win Screen */}
      {gameState === GameState.WON && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg pointer-events-auto z-50">
          <div className="flex flex-col items-center animate-fade-in-up p-4 text-center">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-red-500 mb-8 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] uppercase">
              Defeat! You will never win!
            </h2>
            
            <div className="w-80 h-32 bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center justify-center mb-10 rotate-2 shadow-[0_0_40px_rgba(255,215,0,0.8)] border-4 border-white transform hover:scale-110 transition-transform">
                <span className="font-black text-red-900 text-3xl drop-shadow-sm">15 MINUTE APPLE</span>
            </div>
            
            <button 
              onClick={onRestart}
              className="mt-4 px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-yellow-100 transition-colors shadow-2xl"
            >
              Try my luck again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
