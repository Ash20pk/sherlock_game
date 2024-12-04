import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TelegramEffect({ text, isComplete }) {
  const cleanText = text.replace('###NARRATIVE###', '').trim();

  return (
    <div className="min-h-[100px] bg-amber-50 p-6 rounded-lg border-2 border-amber-200 shadow-lg relative">
      <div className="space-y-4 font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
        {cleanText}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [0, 1] }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: "easeInOut"
            }}
            className="inline-block w-2 h-4 bg-gray-800 ml-1 align-middle"
          />
        )}
      </div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-amber-200/50" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-amber-200/50" />
      </div>
    </div>
  );
}