import { create } from 'zustand';
import { CONSTANTS } from './utils/constants';

type GameStatus = 'menu' | 'playing' | 'gameover';

interface Powerups {
  jetpack: number;
  magnet: number;
  sneakers: number;
  multiplier: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  coins: number;
  speed: number;
  powerups: Powerups;
  soundEnabled: boolean;
  startGame: () => void;
  endGame: () => void;
  addCoin: () => void;
  addScore: (amount: number) => void;
  increaseSpeed: (amount: number) => void;
  activatePowerup: (type: keyof Powerups, duration: number) => void;
  tickPowerups: (delta: number) => void;
  toggleSound: () => void;
  reset: () => void;
}

const getStoredHighScore = () => {
  const stored = localStorage.getItem('block-surfer-highscore');
  return stored ? parseInt(stored, 10) : 0;
};

export const useGameStore = create<GameState>((set) => ({
  status: 'menu',
  score: 0,
  highScore: getStoredHighScore(),
  coins: 0,
  speed: CONSTANTS.BASE_SPEED,
  powerups: {
    jetpack: 0,
    magnet: 0,
    sneakers: 0,
    multiplier: 0,
  },
  soundEnabled: true,
  startGame: () => set({ status: 'playing', score: 0, coins: 0, speed: CONSTANTS.BASE_SPEED, powerups: { jetpack: 0, magnet: 0, sneakers: 0, multiplier: 0 } }),
  endGame: () => set((state) => {
    if (state.score > state.highScore) {
      localStorage.setItem('block-surfer-highscore', Math.floor(state.score).toString());
      return { status: 'gameover', highScore: Math.floor(state.score) };
    }
    return { status: 'gameover' };
  }),
  addCoin: () => set((state) => {
    const speedMultiplier = Math.floor(state.speed / 10);
    const powerupMultiplier = state.powerups.multiplier > 0 ? 2 : 1;
    const newScore = state.score + 10 * speedMultiplier * powerupMultiplier;
    const newHighScore = Math.max(state.highScore, newScore);
    if (newHighScore > state.highScore) {
      localStorage.setItem('block-surfer-highscore', Math.floor(newHighScore).toString());
    }
    return { coins: state.coins + 1, score: newScore, highScore: newHighScore };
  }),
  addScore: (amount) => set((state) => {
    const speedMultiplier = Math.floor(state.speed / 10);
    const powerupMultiplier = state.powerups.multiplier > 0 ? 2 : 1;
    const newScore = state.score + amount * speedMultiplier * powerupMultiplier;
    const newHighScore = Math.max(state.highScore, newScore);
    if (newHighScore > state.highScore) {
      localStorage.setItem('block-surfer-highscore', Math.floor(newHighScore).toString());
    }
    return { score: newScore, highScore: newHighScore };
  }),
  increaseSpeed: (amount) => set((state) => ({ speed: Math.min(state.speed + amount, CONSTANTS.MAX_SPEED) })),
  activatePowerup: (type, duration) => set((state) => ({
    powerups: { ...state.powerups, [type]: duration }
  })),
  tickPowerups: (delta) => set((state) => {
    const newPowerups = { ...state.powerups };
    let changed = false;
    for (const key in newPowerups) {
      const k = key as keyof Powerups;
      if (newPowerups[k] > 0) {
        newPowerups[k] = Math.max(0, newPowerups[k] - delta);
        changed = true;
      }
    }
    return changed ? { powerups: newPowerups } : state;
  }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  reset: () => set({ status: 'menu', score: 0, coins: 0, speed: CONSTANTS.BASE_SPEED, powerups: { jetpack: 0, magnet: 0, sneakers: 0, multiplier: 0 } })
}));
