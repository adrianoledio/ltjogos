import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../data/db';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playGameMusic: (url: string) => void;
  stopGameMusic: () => void;
  playSfx: (type: 'spin' | 'win' | 'click' | 'lose' | 'diamond') => void;
  playSound: (type: 'spin' | 'win' | 'click' | 'lose' | 'diamond') => void;
}

const AudioContextReact = createContext<AudioContextType | undefined>(undefined);

// Shared AudioContext to prevent hitting the browser limit
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      const settings = await db.getSettings();
      if (settings.globalMusic) {
        globalAudioRef.current = new Audio(settings.globalMusic);
        globalAudioRef.current.loop = true;
        globalAudioRef.current.volume = 0.3;
        if (!isMuted) {
          globalAudioRef.current.play().catch(() => console.warn('Autoplay blocked'));
        }
      }
    };
    initAudio();
    return () => {
      globalAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }
      if (globalAudioRef.current && globalAudioRef.current.paused && !isMuted && !gameAudioRef.current) {
        globalAudioRef.current.play().catch(() => {});
      }
      if (gameAudioRef.current && gameAudioRef.current.paused && !isMuted) {
        gameAudioRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isMuted]);

  useEffect(() => {
    if (globalAudioRef.current) globalAudioRef.current.muted = isMuted;
    if (gameAudioRef.current) gameAudioRef.current.muted = isMuted;
  }, [isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  const playGameMusic = (url: string) => {
    if (globalAudioRef.current) globalAudioRef.current.pause();
    if (gameAudioRef.current) gameAudioRef.current.pause();

    if (url) {
      gameAudioRef.current = new Audio(url);
      gameAudioRef.current.loop = true;
      gameAudioRef.current.volume = 0.5;
      gameAudioRef.current.muted = isMuted;
      gameAudioRef.current.play().catch(() => console.warn('Autoplay blocked'));
    }
  };

  const stopGameMusic = () => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current = null;
    }
    if (globalAudioRef.current && !isMuted) {
      globalAudioRef.current.play().catch(() => console.warn('Autoplay blocked'));
    }
  };

  const playSfx = (type: 'spin' | 'win' | 'click' | 'lose' | 'diamond') => {
    if (isMuted) return;
    
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      if (type === 'lose') {
        // Explosion / Crash sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        // White noise buffer for explosion texture
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 1);
        
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(t);
        noise.stop(t + 1);

        // Low frequency boom
        const boom = ctx.createOscillator();
        const boomGain = ctx.createGain();
        boom.type = 'sawtooth';
        boom.frequency.setValueAtTime(100, t);
        boom.frequency.exponentialRampToValueAtTime(10, t + 1);
        boomGain.gain.setValueAtTime(0.5, t);
        boomGain.gain.exponentialRampToValueAtTime(0.01, t + 1);
        
        boom.connect(boomGain);
        boomGain.connect(ctx.destination);
        boom.start(t);
        boom.stop(t + 1);

      } else if (type === 'win') {
        // Coin / Success sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);

      } else if (type === 'diamond') {
        // Gem reveal sound (high ping)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);

      } else if (type === 'spin') {
        // Rolling sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.1);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);

      } else {
        // Click (default)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  return (
    <AudioContextReact.Provider value={{ isMuted, toggleMute, playGameMusic, stopGameMusic, playSfx, playSound: playSfx }}>
      {children}
    </AudioContextReact.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextReact);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}
