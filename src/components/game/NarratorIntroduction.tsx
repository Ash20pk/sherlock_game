import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameState';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { useEffect, useState } from 'react';
import TelegramEffect from '@/components/ui/TelegramEffect';
import { Hourglass, MapPin, Mail } from 'lucide-react';

export default function NarratorIntroduction() {
  const { setPhase, addDialogue } = useGameStore();
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse();
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    startStreaming('NARRATOR_INTRODUCTION', {
      currentLocation: '221B Baker Street',
    });

    return () => {
      stopStreaming();
    };
  }, []);

  useEffect(() => {
    if (streamingState.isComplete) {
      setShowContinue(true);
    }
  }, [streamingState.isComplete]);

  const handleContinue = () => {
    setPhase('HOLMES_INITIAL_REACTION');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-stone-900/90"
    >
      {/* Victorian Paper Background */}
      <div className="relative max-w-4xl w-full">
        {/* Decorative Corner Elements */}
        <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-amber-700/50" />
        <div className="absolute -top-2 -right-2 w-16 h-16 border-t-2 border-r-2 border-amber-700/50" />
        <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b-2 border-l-2 border-amber-700/50" />
        <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-amber-700/50" />

        <div className="bg-gradient-to-b from-stone-100 to-stone-200 p-8 rounded-sm shadow-2xl border border-amber-800/20">
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative inline-block"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Mail className="w-8 h-8 text-amber-800" />
              </div>
              <div className="border-2 border-amber-800/30 p-6 rounded-sm bg-amber-50">
                <h2 className="text-2xl font-bold font-serif text-stone-800 tracking-wider">
                  URGENT TELEGRAM
                </h2>
                <div className="flex items-center justify-center gap-4 text-sm text-stone-600 mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    SCOTLAND YARD
                  </span>
                  <span className="text-amber-800">•</span>
                  <span>{new Date().toLocaleDateString('en-GB', { 
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Telegram Content */}
          <div className="mb-12 font-serif">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-800/20 to-transparent" />
              <TelegramEffect 
                text={streamingState.content || ''} 
                isComplete={streamingState.isComplete}
              />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-800/20 to-transparent" />
            </div>
          </div>

          {/* Error Display */}
          {streamingState.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-800 text-center p-4 bg-red-50 rounded-sm border border-red-200 mb-8"
            >
              {streamingState.error}
            </motion.div>
          )}

          {/* Loading Indicator */}
          {!streamingState.isComplete && !streamingState.error && (
            <div className="flex justify-center">
              <Hourglass className="w-6 h-6 text-amber-800 animate-spin" />
            </div>
          )}

          {/* Continue Button */}
          {showContinue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-8"
            >
              <button
                onClick={handleContinue}
                className="relative group px-8 py-3 bg-stone-800 text-stone-100 rounded-sm
                         transition-all duration-300 hover:bg-stone-700
                         font-serif tracking-wide"
              >
                <span className="absolute inset-0 border border-stone-600 rounded-sm 
                             transform group-hover:translate-x-1 group-hover:translate-y-1 
                             transition-transform" />
                <span className="relative inline-flex items-center gap-2">
                  Proceed to 221B Baker Street
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}