import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameState';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { useEffect, useState } from 'react';
import { TelegramEffect } from '@/components/ui/TelegramEffect';

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

  console.log(streamingState);

  useEffect(() => {
    if (streamingState.isComplete && streamingState.fullResponse) {
      streamingState.fullResponse.dialogueEntries?.forEach(entry => {
        addDialogue(entry);
      });
      setTimeout(() => setShowContinue(true), 1000);
    }
  }, [streamingState.isComplete, streamingState.fullResponse, addDialogue]);

  const handleContinue = () => {
    setPhase('HOLMES_INITIAL_REACTION');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-4 md:p-8"
    >
      <div className="bg-stone-100/80 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-amber-100 px-6 py-2 rounded-lg border-2 border-amber-200"
          >
            <h2 className="text-2xl font-bold text-stone-800 tracking-wider">
              URGENT TELEGRAM
            </h2>
            <div className="text-sm text-stone-600 mt-1">
              FROM: SCOTLAND YARD • {new Date().toLocaleDateString('en-GB', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </motion.div>
        </div>

        <div className="mb-8">
          <TelegramEffect 
            text={streamingState.narrative || ''} 
            isComplete={streamingState.isComplete}
          />
        </div>

        {streamingState.error && (
          <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg">
            {streamingState.error}
          </div>
        )}

        {showContinue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <button
              onClick={handleContinue}
              className="bg-stone-800 text-white px-8 py-3 rounded-lg 
                       hover:bg-stone-700 transition-colors duration-200
                       font-medium tracking-wide shadow-lg
                       hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Proceed to 221B Baker Street →
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
