import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { loadAssets } from './services/assetLoader';
import { GameState, GameAssets } from './types';
import { BOSS_HITS_REQUIRED } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [bossHp, setBossHp] = useState(BOSS_HITS_REQUIRED);
  const [timeLeft, setTimeLeft] = useState(30);
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets().then((loadedAssets) => {
      setAssets(loadedAssets);
      setLoading(false);
    });
  }, []);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setTimeLeft(30);
  };

  const handleRestart = () => {
    setGameState(GameState.START);
    // The GameCanvas effect will listen to this transition and reset internal refs
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mr-4"></div>
        Loading Assets...
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden relative bg-gray-900">
      <GameCanvas 
        assets={assets}
        gameState={gameState} 
        setGameState={setGameState}
        setScore={setScore}
        setBossHp={setBossHp}
        setTimeLeft={setTimeLeft}
      />
      
      <UIOverlay 
        gameState={gameState}
        score={score}
        bossHp={bossHp}
        timeLeft={timeLeft}
        assets={assets}
        onStart={handleStart}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default App;