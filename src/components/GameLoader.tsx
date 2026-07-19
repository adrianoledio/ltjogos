import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameLoaderProps {
  onComplete: () => void;
  backgroundImage: string;
  gameName: string;
}

export const GameLoader: React.FC<GameLoaderProps> = ({ onComplete, backgroundImage, gameName }) => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const duration = 2000; // 2 seconds to load
    const interval = 20; // update every 20ms
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsLoaded(true);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-12 tracking-wider text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          {gameName}
        </h1>

        {/* Progress Bar Container */}
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-600 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.02 }}
          />
        </div>

        {/* Percentage */}
        <div className="text-white font-mono text-xl mb-8 font-bold drop-shadow-md">
          {progress}%
        </div>

        {/* Play Button */}
        <div className="h-16 w-full flex items-center justify-center">
          <AnimatePresence>
            {isLoaded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="px-12 py-4 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-black text-xl rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transition-all"
              >
                JOGAR
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
