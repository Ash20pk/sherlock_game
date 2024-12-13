import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TelegramEffect({ text, isComplete }) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const cleanText = text.replace('###NARRATIVE###', '').trim();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimestamp(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[120px]">
      {/* Aged paper texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 opacity-40" />
      
      {/* Main telegram content */}
      <div className="relative bg-stone-50 p-8 rounded-sm border border-amber-800/20 shadow-lg">
        {/* Decorative holes */}
        <div className="absolute left-3 top-0 flex flex-col gap-4 h-full py-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-900/20"
            />
          ))}
        </div>
        
        {/* Telegram header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center justify-between text-xs text-stone-600 font-mono uppercase"
        >
          <span>Via Western Union</span>
          {showTimestamp && (
            <span className="tabular-nums">
              {new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </motion.div>

        {/* Message content */}
        <div className="space-y-4 font-mono text-stone-800 leading-relaxed">
          {cleanText.split('\n').map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {paragraph}
              {/* Text distress effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-amber-900/5 to-transparent opacity-30" />
            </motion.p>
          ))}
          
          {/* Typing cursor */}
          {!isComplete && (
            <motion.span
              animate={{ 
                opacity: [1, 0],
                scaleY: [1, 0.8]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                ease: "easeInOut"
              }}
              className="inline-block w-2 h-4 bg-stone-800 ml-1 align-middle"
            />
          )}
        </div>

        {/* Bottom stamp - only show when complete */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-4 right-8 transform rotate-[-4deg]"
          >
            <div className="px-4 py-2 bg-amber-900/10 rounded-sm border border-amber-900/20">
              <span className="text-xs font-mono text-stone-600">
                RECEIVED • STOP
              </span>
            </div>
          </motion.div>
        )}

        {/* Decorative edges */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-800/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-800/20 to-transparent" />
      </div>

      {/* Paper texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="w-full h-full bg-[radial-gradient(#7c6032_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Telegraph wire decorative element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -left-4 top-0 bottom-0 w-px bg-amber-800/20"
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 w-2 h-px bg-amber-800/20"
            style={{ top: `${(i + 1) * 12}%` }}
          />
        ))}
      </motion.div>
    </div>
  );
}