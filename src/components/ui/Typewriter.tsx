import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  isStreaming?: boolean;
}

export function Typewriter({
  text,
  speed = 30,
  className = '',
  onComplete,
  isStreaming = false
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const streamTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!text) return;
    if (typeof text !== 'string') {
      console.error('Typewriter received non-string text:', text);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Typing text:', text.slice(0, 50) + '...');
    }

    // Reset completion state when text changes
    setIsComplete(false);

    if (isStreaming) {
      // For streaming, smoothly update the text without resetting
      setDisplayedText(text);
      // Only mark as complete if we haven't received new text for a while
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      streamTimeoutRef.current = setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 500); // Increased delay to prevent premature completion
    } else {
      // For non-streaming, animate each character
      let currentIndex = 0;

      const typeNextCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeNextCharacter, speed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Start typing
      typeNextCharacter();
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, [text, speed, onComplete, isStreaming]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -right-4 top-1/2 -translate-y-1/2"
          >
            <span className="inline-block w-2 h-4 bg-stone-800 animate-blink" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="whitespace-pre-wrap">{displayedText}</div>
    </div>
  );
}
