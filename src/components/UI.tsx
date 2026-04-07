import { useGameStore } from '../store';
import { useInput } from '../hooks/useInput';
import { useDrag } from '@use-gesture/react';
import { soundManager } from '../utils/soundManager';
import { Volume2, VolumeX } from 'lucide-react';

function HUD() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const coins = useGameStore((state) => state.coins);
  const powerups = useGameStore((state) => state.powerups);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none font-mono">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="mc-panel text-black px-4 py-2 text-3xl pointer-events-none">
            SCORE: {Math.floor(score)}
          </div>
          <div className="mc-panel !bg-gray-800 text-white px-4 py-2 text-2xl pointer-events-none opacity-80">
            BEST: {Math.floor(highScore)}
          </div>
        </div>
        <button 
          onClick={() => {
            toggleSound();
            soundManager.play('click');
          }}
          className="mc-btn w-12 h-12 flex items-center justify-center pointer-events-auto"
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>
      <div className="flex gap-2">
        {powerups.jetpack > 0 && <div className="mc-panel !bg-red-500 text-white px-3 py-2 text-2xl mc-text-shadow">JETPACK: {Math.ceil(powerups.jetpack)}s</div>}
        {powerups.magnet > 0 && <div className="mc-panel !bg-fuchsia-500 text-white px-3 py-2 text-2xl mc-text-shadow">MAGNET: {Math.ceil(powerups.magnet)}s</div>}
        {powerups.sneakers > 0 && <div className="mc-panel !bg-cyan-500 text-white px-3 py-2 text-2xl mc-text-shadow">SNEAKERS: {Math.ceil(powerups.sneakers)}s</div>}
        {powerups.multiplier > 0 && <div className="mc-panel !bg-purple-500 text-white px-3 py-2 text-2xl mc-text-shadow">2X COINS: {Math.ceil(powerups.multiplier)}s</div>}
      </div>
      <div className="mc-panel !bg-yellow-400 text-black px-4 py-2 text-3xl font-bold">
        COINS: {coins}
      </div>
    </div>
  );
}

export function UI() {
  const status = useGameStore((state) => state.status);
  const startGame = useGameStore((state) => state.startGame);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const { triggerInput } = useInput();

  // Handle swipe gestures for mobile
  const bind = useDrag(({ swipe: [swipeX, swipeY], tap }) => {
    if (status !== 'playing' || tap) return;
    
    if (swipeX === -1) triggerInput('left');
    else if (swipeX === 1) triggerInput('right');
    else if (swipeY === -1) triggerInput('up'); // swipe up
    else if (swipeY === 1) triggerInput('down'); // swipe down
  }, {
    swipe: {
      distance: 30,
      velocity: 0.2
    },
    filterTaps: true
  });

  return (
    <div 
      {...(bind as any)()} 
      className="absolute inset-0 pointer-events-auto touch-none select-none"
      style={{ touchAction: 'none' }}
    >
      {/* HUD */}
      {status === 'playing' && (
        <HUD />
      )}

      {/* Menus */}
      {status === 'menu' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono">
          <div className="mc-panel p-8 text-center max-w-md w-full">
            <h1 className="text-7xl font-black mb-2 mc-title">BLOCK SURFER</h1>
            <p className="text-gray-800 mb-8 text-2xl font-bold">Swipe to move, jump, and slide.</p>
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => {
                  toggleSound();
                  soundManager.play('click');
                }}
                className="mc-btn flex-1 py-2 text-2xl pointer-events-auto flex items-center justify-center gap-2"
              >
                {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                {soundEnabled ? "SOUND ON" : "SOUND OFF"}
              </button>
            </div>
            <button 
              onClick={() => {
                startGame();
                soundManager.play('click');
                soundManager.startBgMusic();
              }}
              className="mc-btn w-full py-4 text-4xl pointer-events-auto"
            >
              TAP TO PLAY
            </button>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center font-mono">
          <div className="mc-panel p-8 text-center max-w-md w-full">
            <h1 className="text-8xl font-black mb-4 text-red-600 mc-text-shadow">WASTED</h1>
            <GameOverStats />
            <button 
              onClick={() => {
                startGame();
                soundManager.play('click');
                soundManager.startBgMusic();
              }}
              className="mc-btn w-full py-4 text-4xl pointer-events-auto"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GameOverStats() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const coins = useGameStore((state) => state.coins);
  return (
    <>
      <div className="text-4xl mb-2 font-bold text-gray-800">SCORE: {Math.floor(score)}</div>
      <div className="text-3xl mb-2 font-bold text-gray-600">BEST: {Math.floor(highScore)}</div>
      <div className="text-4xl mb-8 font-bold text-yellow-600">COINS: {coins}</div>
    </>
  );
}
