import confetti from 'canvas-confetti';

/**
 * Standard game win confetti burst.
 */
export const triggerWinConfetti = () => {
  try {
    // Left side burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#FFCC00', '#FFD700', '#10B981', '#FFFFFF', '#F59E0B'],
      zIndex: 9999,
    });

    // Right side burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#FFCC00', '#FFD700', '#10B981', '#FFFFFF', '#F59E0B'],
      zIndex: 9999,
    });
  } catch (err) {
    console.error('Error triggering win confetti:', err);
  }
};

/**
 * Big win / Jackpot celebratory firework bursts.
 */
export const triggerBigWinConfetti = () => {
  try {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);

      // Random bursts across upper screen
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() * 0.5 + 0.1 },
        colors: ['#FFD700', '#FFAC1C', '#00FFCC', '#E6C200', '#FFFFFF', '#F59E0B'],
        zIndex: 10000,
        shapes: ['circle', 'square'],
      });
    }, 250);
  } catch (err) {
    console.error('Error triggering big win confetti:', err);
  }
};

/**
 * Subtle burst for Recent Gains / feed interactions.
 */
export const triggerRecentGainConfetti = (originX: number = 0.5, originY: number = 0.5) => {
  try {
    confetti({
      particleCount: 30,
      spread: 60,
      startVelocity: 20,
      origin: { x: originX, y: originY },
      colors: ['#FFCC00', '#10B981', '#3B82F6', '#F59E0B'],
      zIndex: 9999,
      ticks: 80,
      scalar: 0.8,
    });
  } catch (err) {
    console.error('Error triggering recent gain confetti:', err);
  }
};
