
import React from 'react';
import { GameState, GameAssets } from '../types';
import { BOSS_HITS_REQUIRED } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  bossHp: number;
  assets: GameAssets | null;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  score, 
  bossHp, 
  assets, 
  onStart,
  onRestart 
}) => {
  
  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans overflow-hidden">
      
      {/* HUD - Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex flex-col items-center pt-2 z-10">
         {/* Top Branding Text */}
         <div className="text-white/90 text-sm font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
            NISPY GETTIN FRUTTY
         </div>

        {assets?.logo && assets.logo.width > 50 ? (
             <img src={assets.logo.src} alt="Nispy Logo" className="h-12 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
        ) : (
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 text-3xl font-black italic tracking-tighter drop-shadow-lg">
                NUGGET HUNT
            </h1>
        )}
      </div>

      {/* HUD - Score (Modern Badge) */}
      {(gameState === GameState.PLAYING || gameState === GameState.BOSS_FIGHT) && (
        <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-white font-bold shadow-xl">
          <div className="text-xs text-gray-300 uppercase">Score</div>
          <div className="text-2xl text-yellow-400">{score}</div>
        </div>
      )}

      {/* HUD - Boss Health */}
      {gameState === GameState.BOSS_FIGHT && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-80">
          <div className="flex justify-between text-white text-xs font-bold mb-1 px-1">
            <span>THE BOSS</span>
            <span>{(bossHp/BOSS_HITS_REQUIRED*100).toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-gray-900 rounded-full border border-gray-600 overflow-hidden relative shadow-lg">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300 relative"
              style={{ width: `${(bossHp / BOSS_HITS_REQUIRED) * 100}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto z-50">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-gray-700 shadow-2xl flex flex-col items-center max-w-sm mx-4">
              <h1 className="text-4xl font-black text-white mb-2 text-center uppercase italic">Nugget Hunt</h1>
              <div className="h-1 w-20 bg-red-500 rounded mb-6"></div>
              
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                The box is open.<br/>
                The nuggets are flying.<br/>
                <strong>Aim carefully.</strong>
              </p>

              <button 
                onClick={onStart}
                className="group relative px-8 py-4 bg-red-600 rounded-full text-white font-bold tracking-wider overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] transition-all active:scale-95"
              >
                <span className="relative z-10">START HUNTING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
          </div>
        </div>
      )}

      {/* Boss Intro */}
      {gameState === GameState.BOSS_INTRO && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 z-40">
          <div className="transform rotate-[-5deg] bg-red-600 text-white p-6 border-4 border-white shadow-2xl animate-bounce">
            <h1 className="text-5xl font-black uppercase tracking-tighter">BOSS INCOMING</h1>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {gameState === GameState.WON && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto z-50">
          <div className="flex flex-col items-center animate-fade-in-up">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-8 drop-shadow-sm">VICTORY</h2>
            
            {assets?.ribbon && assets.ribbon.width > 50 ? (
               <img src={assets.ribbon.src} alt="15 Minute Apple" className="max-w-[90%] md:max-w-md mb-8 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
            ) : (
                <div className="w-64 h-20 bg-yellow-500 flex items-center justify-center mb-8 rotate-3 shadow-lg border-4 border-white">
                    <span className="font-bold text-red-900 text-xl">15 MINUTE APPLE</span>
                </div>
            )}
            
            <button 
              onClick={onRestart}
              className="mt-4 px-10 py-3 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition-colors shadow-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
