import { useEffect } from 'react';
import { create } from 'zustand';

interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface InputStore {
  input: InputState;
  setInput: (dir: keyof InputState, value: boolean) => void;
  triggerInput: (dir: keyof InputState) => void;
}

export const useInputStore = create<InputStore>((set) => ({
  input: { left: false, right: false, up: false, down: false },
  setInput: (dir, value) => set((state) => ({ input: { ...state.input, [dir]: value } })),
  triggerInput: (dir) => {
    set((state) => ({ input: { ...state.input, [dir]: true } }));
    setTimeout(() => {
      set((state) => ({ input: { ...state.input, [dir]: false } }));
    }, 100);
  }
}));

export function useInput() {
  const input = useInputStore((state) => state.input);
  const setInput = useInputStore((state) => state.setInput);
  const triggerInput = useInputStore((state) => state.triggerInput);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          setInput('left', true);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setInput('right', true);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          setInput('up', true);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setInput('down', true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          setInput('left', false);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setInput('right', false);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          setInput('up', false);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setInput('down', false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setInput]);

  return { input, triggerInput };
}
