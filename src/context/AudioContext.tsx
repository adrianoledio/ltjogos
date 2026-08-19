import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../data/db';
import { getCachedAudioUrl } from '../lib/assetCache';

type SfxType = 'spin' | 'win' | 'click' | 'lose' | 'diamond' | 'bigwin' | 'scatter' | 'bonus' | 'fever' | 'cascade';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playGameMusic: (url?: string) => void;
  stopGameMusic: () => void;
  playSfx: (type: SfxType) => void;
  playSound: (type: SfxType) => void;
}

const AudioContextReact = createContext<AudioContextType | undefined>(undefined);

// Shared AudioContext to prevent hitting the browser limit
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Web Audio Ambient Synthesizer for games
let synthBgmTimer: any = null;
let isSynthBgmActive = false;
let currentSynthTheme = '';

const startSynthBgm = (isMuted: boolean, themeKey: string = 'default') => {
  if (isMuted) return;
  
  if (isSynthBgmActive && currentSynthTheme === themeKey) return;
  
  if (synthBgmTimer) {
    clearInterval(synthBgmTimer);
    synthBgmTimer = null;
  }

  isSynthBgmActive = true;
  currentSynthTheme = themeKey;

  let step = 0;
  let intervalMs = 400;

  if (themeKey.includes('calavera')) {
    // Calavera Ink - Mexican Day of the Dead / Mariachi Brass & Spanish Guitars
    intervalMs = 320;
    const spanishGuitars = [164.81, 174.61, 207.65, 220.00, 246.94, 261.63, 293.66, 329.63]; // Spanish Phrygian
    const trumpetArp = [329.63, 415.30, 493.88, 659.25];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        // Acoustic Guitar Strum
        const gFreq = spanishGuitars[step % spanishGuitars.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(gFreq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);

        // Mariachi Trumpet Accent on beat 2 and 4
        if (step % 4 === 1 || step % 4 === 3) {
          const tFreq = trumpetArp[(step / 2 | 0) % trumpetArp.length];
          const tOsc = ctx.createOscillator();
          const tGain = ctx.createGain();
          const tFilter = ctx.createBiquadFilter();

          tOsc.type = 'sawtooth';
          tOsc.frequency.setValueAtTime(tFreq, t);

          tFilter.type = 'bandpass';
          tFilter.frequency.setValueAtTime(1200, t);
          tFilter.Q.setValueAtTime(2, t);

          tGain.gain.setValueAtTime(0, t);
          tGain.gain.linearRampToValueAtTime(0.05, t + 0.03);
          tGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

          tOsc.connect(tFilter);
          tFilter.connect(tGain);
          tGain.connect(ctx.destination);
          tOsc.start(t);
          tOsc.stop(t + 0.26);
        }

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('tattoo-slot') || themeKey.includes('tattoo_slot') || themeKey.includes('rock')) {
    // Tattoo Slot - Hard Rock & Metal Electric Guitar Parlor
    intervalMs = 280;
    const guitarRiff = [82.41, 98.00, 110.00, 116.54, 123.47, 146.83, 110.00, 82.41]; // E Minor Pentatonic
    
    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        const freq = guitarRiff[step % guitarRiff.length];
        
        // Electric Guitar Drive Osc
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.Q.setValueAtTime(4, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);

        // Rock Kick Drum on beat 1 and 3
        if (step % 4 === 0) {
          const kick = ctx.createOscillator();
          const kGain = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(120, t);
          kick.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          kGain.gain.setValueAtTime(0.2, t);
          kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kick.connect(kGain);
          kGain.connect(ctx.destination);
          kick.start(t);
          kick.stop(t + 0.13);
        }

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('yakuza') || themeKey.includes('japan')) {
    // Yakuza Ink - Japanese Traditional Koto & Taiko Drum
    intervalMs = 450;
    const hirajoshiScale = [220.00, 246.94, 261.63, 329.63, 349.23, 440.00, 493.88];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        // Koto Pluck
        const freq = hirajoshiScale[step % hirajoshiScale.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.42);

        // Deep Taiko Drum
        if (step % 4 === 0) {
          const taiko = ctx.createOscillator();
          const tGain = ctx.createGain();
          taiko.type = 'sine';
          taiko.frequency.setValueAtTime(90, t);
          taiko.frequency.exponentialRampToValueAtTime(25, t + 0.35);
          tGain.gain.setValueAtTime(0.25, t);
          tGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          taiko.connect(tGain);
          tGain.connect(ctx.destination);
          taiko.start(t);
          taiko.stop(t + 0.36);
        }

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('rouletta') || themeKey.includes('casino') || themeKey.includes('lounge')) {
    // Rouletta Ink - Luxury VIP Casino Jazz Lounge
    intervalMs = 480;
    const rhodesChords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        const chord = rhodesChords[(step / 2 | 0) % rhodesChords.length];
        const noteFreq = chord[step % chord.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.48);

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('mystic') || themeKey.includes('wild-tattoo')) {
    // Mystic Ink & Wild Tattoo - Ancient Magic Flute & Chimes
    intervalMs = 550;
    const mysticScale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33]; // D Minor Pentatonic

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        const freq = mysticScale[step % mysticScale.length];

        // Bamboo Flute Tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.52);

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('ink-reveal') || themeKey.includes('scratch')) {
    // Ink Reveal - Lo-Fi Chill Kalimba Pads
    intervalMs = 500;
    const kalimbaNotes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        const freq = kalimbaNotes[step % kalimbaNotes.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.42);

        step++;
      } catch {}
    }, intervalMs);

  } else if (themeKey.includes('tattoo-cash') || themeKey.includes('cash') || themeKey.includes('crash')) {
    // Tattoo Cash - High-Voltage Cyberpunk Arp Synth
    intervalMs = 220;
    const bassArp = [110.00, 130.81, 146.83, 164.81, 220.00, 261.63, 220.00, 164.81];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;

        const freq = bassArp[step % bassArp.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + (step % 8) * 150, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);

        step++;
      } catch {}
    }, intervalMs);

  } else {
    // Default Casino Synth
    intervalMs = 400;
    const scale = [261.63, 329.63, 392.00, 493.88, 220.00, 261.63, 329.63, 392.00];

    synthBgmTimer = setInterval(() => {
      if (!isSynthBgmActive) return;
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const t = ctx.currentTime;
        const freq = scale[step % scale.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.38);

        step++;
      } catch {}
    }, intervalMs);
  }
};

const stopSynthBgm = () => {
  isSynthBgmActive = false;
  currentSynthTheme = '';
  if (synthBgmTimer) {
    clearInterval(synthBgmTimer);
    synthBgmTimer = null;
  }
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const initAudio = async () => {
      const settings = await db.getSettings();
      if (settings.globalMusic) {
        const audioSrc = await getCachedAudioUrl(settings.globalMusic);
        globalAudioRef.current = new Audio(audioSrc || settings.globalMusic);
        globalAudioRef.current.loop = true;
        globalAudioRef.current.volume = 0.15;
        if (!isMuted) {
          globalAudioRef.current.play().catch(() => console.warn('Autoplay blocked'));
        }
      }
    };
    initAudio();
    return () => {
      globalAudioRef.current?.pause();
      stopSynthBgm();
    };
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
      if (globalAudioRef.current && globalAudioRef.current.paused && !isMuted && !gameAudioRef.current && !isSynthBgmActive) {
        globalAudioRef.current.play().catch(() => {});
      }
      if (gameAudioRef.current && gameAudioRef.current.paused && !isMuted) {
        gameAudioRef.current.play().catch(() => {});
      }
    };

    const events = ['click', 'touchstart', 'pointerdown', 'keydown'];
    events.forEach(event => document.addEventListener(event, handleInteraction));

    return () => {
      events.forEach(event => document.removeEventListener(event, handleInteraction));
    };
  }, [isMuted]);

  useEffect(() => {
    if (globalAudioRef.current) globalAudioRef.current.muted = isMuted;
    if (gameAudioRef.current) gameAudioRef.current.muted = isMuted;
    if (isMuted) {
      stopSynthBgm();
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) stopSynthBgm();
      return next;
    });
  };

  const playGameMusic = (url?: string) => {
    if (globalAudioRef.current) globalAudioRef.current.pause();
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current = null;
    }
    stopSynthBgm();

    if (!url || !url.trim()) return;

    const trimmedUrl = url.trim();

    getCachedAudioUrl(trimmedUrl).then((cachedSrc) => {
      try {
        const audio = new Audio(cachedSrc || trimmedUrl);
        audio.loop = true;
        audio.volume = 0.15; // Ambient background music volume
        audio.muted = isMutedRef.current;
        gameAudioRef.current = audio;
        audio.play().catch((err) => {
          console.warn('Playback of external audio URL blocked or failed:', err);
        });
      } catch (err) {
        console.warn('Error loading audio URL:', err);
      }
    }).catch(() => {
      try {
        const audio = new Audio(trimmedUrl);
        audio.loop = true;
        audio.volume = 0.15;
        audio.muted = isMutedRef.current;
        gameAudioRef.current = audio;
        audio.play().catch(() => {});
      } catch {}
    });
  };

  const stopGameMusic = () => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current = null;
    }
    stopSynthBgm();
    if (globalAudioRef.current && !isMutedRef.current) {
      globalAudioRef.current.play().catch(() => console.warn('Autoplay blocked'));
    }
  };

  const playSfx = (type: SfxType) => {
    if (isMutedRef.current) return;
    
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const t = ctx.currentTime;

      if (type === 'spin') {
        // High quality slot machine reel spin sound (rhythmic ticks)
        for (let i = 0; i < 4; i++) {
          const tickTime = t + i * 0.06;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400 + i * 80, tickTime);
          gain.gain.setValueAtTime(0.45, tickTime);
          gain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(tickTime);
          osc.stop(tickTime + 0.04);
        }

      } else if (type === 'click') {
        // Snappy reel stop / button click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.06);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);

      } else if (type === 'win') {
        // Vibrant victory chime arpeggio (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const startTime = t + idx * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.55, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.3);
        });

      } else if (type === 'bigwin') {
        // Triumphant jackpot fanfare & ringing bells
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const startTime = t + idx * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.7, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });

      } else if (type === 'diamond' || type === 'scatter') {
        // Sparkling high-frequency magic sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, t);
        osc.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);

      } else if (type === 'fever' || type === 'bonus' || type === 'cascade') {
        // Power-up ascending pitch shimmer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);

      } else if (type === 'lose') {
        // Soft descending tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);

      } else {
        // Generic click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
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

