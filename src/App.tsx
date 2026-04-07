/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Game } from './components/Game';
import { UI } from './components/UI';
import { useGameStore } from './store';
import { soundManager } from './utils/soundManager';

export default function App() {
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  useEffect(() => {
    soundManager.updateVolume(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const handleInteraction = () => {
      soundManager.initContext();
      if (soundEnabled) {
        soundManager.startBgMusic();
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [soundEnabled]);

  return (
    <div className="w-full h-screen overflow-hidden bg-black relative">
      <Game />
      <UI />
    </div>
  );
}
