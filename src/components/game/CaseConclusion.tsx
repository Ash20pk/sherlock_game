'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'
import { Evidence, DeductionEntry } from '@/store/gameState'

interface ChatItem {
  id: string;
  type: 'narrative' | 'dialogue' | 'deduction' | 'evidence';
  text: string;
  currentText: string;
  speaker?: string;
  isComplete: boolean;
  evidence?: Evidence;
}

const CaseConclusion: React.FC = () => {
  const { 
    setPhase, 
    addDialogue, 
    addDeduction,
    dialogueHistory,
    evidence,
  } = useGameStore();
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [isAllComplete, setIsAllComplete] = useState(false);
  const storyEndRef = useRef<HTMLDivElement>(null);
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse();
  const typingSpeed = 40;

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems, activeItemIndex]);

  useEffect(() => {
    startStreaming('CASE_CONCLUSION', {
      phase: 'CASE_CONCLUSION',
      recentDialogue: dialogueHistory,
      evidence: evidence,
    });

    return () => {
      stopStreaming();
    };
  }, []);

  // Handle streaming response updates
  useEffect(() => {
    if (streamingState.fullResponse) {
      // Handle dialogue entries
      streamingState.fullResponse.dialogueEntries?.forEach(entry => {
        if (!chatItems.some(item => item.id === `dialogue-${entry.text}`)) {
          setChatItems(prev => [...prev, {
            id: `dialogue-${entry.text}`,
            type: 'dialogue',
            text: entry.text,
            currentText: entry.text,
            speaker: entry.speaker,
            isComplete: true
          }]);
          addDialogue({
            text: entry.text,
            speaker: entry.speaker || '',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle deductions
      streamingState.fullResponse.deductions?.forEach(deduction => {
        if (!chatItems.some(item => item.id === `deduction-${deduction.conclusion}`)) {
          const deductionText = `${deduction.conclusion}\n\nBased on: ${deduction.observation}`;
          setChatItems(prev => [...prev, {
            id: `deduction-${deduction.conclusion}`,
            type: 'deduction',
            text: deductionText,
            currentText: deductionText,
            isComplete: true
          }]);
          addDeduction({
            conclusion: deduction.conclusion,
            observation: deduction.observation,
            timestamp: new Date().toISOString(),
            author: 'HOLMES'
          });
        }
      });

      // Add narrative text if present
      if (streamingState.fullResponse.narrative && 
          !chatItems.some(item => item.id === `narrative-${streamingState.fullResponse.narrative}`)) {
        setChatItems(prev => [...prev, {
          id: `narrative-${streamingState.fullResponse.narrative}`,
          type: 'narrative',
          text: streamingState.fullResponse.narrative,
          currentText: streamingState.fullResponse.narrative,
          isComplete: true
        }]);
      }

      // Move to epilogue when streaming is complete
      if (streamingState.isComplete) {
        setTimeout(() => {
          setPhase('EPILOGUE');
        }, 2000);
      }
    }
  }, [streamingState.fullResponse, addDeduction, addDialogue, chatItems, setPhase]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="space-y-6">
        {chatItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              item.type === 'narrative' 
                ? 'bg-stone-50 text-stone-800' 
                : item.type === 'dialogue'
                ? 'bg-white border-2 border-stone-100'
                : 'bg-amber-50 border-2 border-amber-100'
            }`}
          >
            {item.type === 'dialogue' && (
              <div className="font-medium text-stone-600 mb-2">
                {item.speaker}:
              </div>
            )}
            <div className={`prose ${
              item.type === 'deduction' ? 'text-amber-800' : 'text-stone-800'
            }`}>
              {item.currentText}
            </div>
          </motion.div>
        ))}
      </div>
      <div ref={storyEndRef} />
    </motion.div>
  );
};

export default CaseConclusion;
