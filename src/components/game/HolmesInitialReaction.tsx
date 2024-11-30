import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'

interface ChatItem {
  id: string;
  type: 'narrative' | 'dialogue' | 'deduction';
  text: string;
  currentText: string;
  speaker?: string;
  isComplete: boolean;
  conclusion?: string;
  observation?: string;
}

const StoryBlock = ({ 
  type,
  text,
  speaker,
  isTyping,
}: {
  type: string;
  text: string;
  speaker?: string;
  isTyping: boolean;
}) => {
  const getTextStyle = () => {
    switch (type) {
      case 'narrative':
        return 'text-stone-800';
      case 'dialogue':
        return 'text-stone-900';
      case 'deduction':
        return 'italic text-stone-800';
      default:
        return 'text-stone-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-6"
    >
      {type === 'dialogue' && speaker && (
        <div className="text-stone-600 mb-2 tracking-wide">
          {speaker}:
        </div>
      )}
      <div className={`${getTextStyle()} leading-relaxed text-lg`}>
        {type === 'dialogue' ? `"${text}"` : text}
        {isTyping && (
          <span className="inline-block w-1 h-4 ml-1 bg-stone-400 animate-pulse" />
        )}
      </div>
    </motion.div>
  );
};

export default function HolmesInitialReaction() {
  const { 
    setPhase, 
    addDialogue, 
    addDeduction,
    dialogueHistory,
    setAvailableActions,
    setWatsonJoined,
  } = useGameStore()
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0)
  const [isAllComplete, setIsAllComplete] = useState(false)
  const [showWatsonChoice, setShowWatsonChoice] = useState(false)
  const storyEndRef = useRef<HTMLDivElement>(null)
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse()
  const typingSpeed = 40 // slightly slower for reading comfort

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatItems, activeItemIndex])

  useEffect(() => {
    startStreaming('HOLMES_INITIAL_REACTION', {
      phase: 'HOLMES_INITIAL_REACTION',
      currentLocation: '221B Baker Street',
      recentDialogue: dialogueHistory,
    })

    return () => {
      stopStreaming()
    }
  }, [])

  // Handle streaming text animation
  useEffect(() => {
    if (chatItems.length === 0 || activeItemIndex >= chatItems.length) return

    const currentItem = chatItems[activeItemIndex]
    if (currentItem.isComplete) {
      if (activeItemIndex < chatItems.length - 1) {
        setActiveItemIndex(prev => prev + 1)
      }
      return
    }

    const fullText = currentItem.text
    const currentText = currentItem.currentText || ''

    if (currentText.length < fullText.length) {
      const timeoutId = setTimeout(() => {
        setChatItems(prev => prev.map((item, index) => 
          index === activeItemIndex
            ? { 
                ...item, 
                currentText: fullText.slice(0, currentText.length + 1)
              }
            : item
        ))
      }, typingSpeed)

      return () => clearTimeout(timeoutId)
    } else {
      setChatItems(prev => prev.map((item, index) => 
        index === activeItemIndex ? { ...item, isComplete: true } : item
      ))
    }
  }, [chatItems, activeItemIndex])

  // Handle narrative updates
  useEffect(() => {
    if (streamingState.narrative && !chatItems.some(item => item.type === 'narrative')) {
      setChatItems(prev => [...prev, {
        id: 'narrative',
        type: 'narrative',
        text: streamingState.narrative,
        currentText: '',
        isComplete: false
      }])
    }
  }, [streamingState.narrative])

  // Handle dialogue and deduction updates
  useEffect(() => {
    if (streamingState.fullResponse) {
      streamingState.fullResponse.dialogueEntries?.forEach(entry => {
        if (!chatItems.some(item => item.id === `dialogue-${entry.text}`)) {
          setChatItems(prev => [...prev, {
            id: `dialogue-${entry.text}`,
            type: 'dialogue',
            text: entry.text,
            currentText: '',
            speaker: entry.speaker,
            isComplete: false
          }])
          addDialogue({
            text: entry.text,
            speaker: entry.speaker || '',
            timestamp: new Date().toISOString()
          })
        }
      })

      streamingState.fullResponse.deductions?.forEach(deduction => {
        const deductionText = `${deduction.conclusion}\n\nBased on: ${deduction.observation}`
        if (!chatItems.some(item => item.id === `deduction-${deduction.conclusion}`)) {
          setChatItems(prev => [...prev, {
            id: `deduction-${deduction.conclusion}`,
            type: 'deduction',
            text: deductionText,
            currentText: '',
            isComplete: false,
            conclusion: deduction.conclusion,
            observation: deduction.observation
          }])
          addDeduction({
            conclusion: deduction.conclusion,
            observation: deduction.observation,
            timestamp: new Date().toISOString()
          })
        }
      })

      if (streamingState.fullResponse.availableActions) {
        setAvailableActions(streamingState.fullResponse.availableActions)
      }
    }
  }, [streamingState.fullResponse])

  // Check if all items are complete
  useEffect(() => {
    if (chatItems.length > 0 && chatItems.every(item => item.isComplete)) {
      setIsAllComplete(true)
      // Add small delay before showing Watson's choice
      const timer = setTimeout(() => {
        setShowWatsonChoice(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [chatItems])

  const handleWatsonChoice = (willJoin: boolean) => {
    setWatsonJoined(willJoin)
    
    // Add Watson's response to dialogue
    const response = willJoin 
      ? "I would be honored to assist you in this investigation, Holmes. Your deductions are, as always, fascinating."
      : "I must decline this time, Holmes. Though your deductions intrigue me, my medical practice requires my attention.";
    
    addDialogue({
      text: response,
      speaker: "Dr. Watson",
      timestamp: new Date().toISOString()
    })

    // Add Holmes's acknowledgment
    setTimeout(() => {
      addDialogue({
        text: willJoin 
          ? "Excellent, Watson! Your medical expertise may prove invaluable in this case."
          : "I understand, my dear Watson. I shall keep you informed of any remarkable developments.",
        speaker: "Sherlock Holmes",
        timestamp: new Date().toISOString()
      })

      // Move to story development phase
      setTimeout(() => {
        setPhase('STORY_DEVELOPMENT')
      }, 2000)
    }, 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-50"
    >
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="prose prose-stone prose-lg max-w-none">
          <div className="text-sm text-stone-500 mb-8">
            221B Baker Street
          </div>
          
          <div className="space-y-2">
            {chatItems.map((item, index) => (
              <StoryBlock
                key={item.id}
                type={item.type}
                text={index <= activeItemIndex ? item.currentText || '' : ''}
                speaker={item.speaker}
                isTyping={index === activeItemIndex && !item.isComplete}
              />
            ))}
            <div ref={storyEndRef} />
          </div>

          {streamingState.error && (
            <div className="text-red-600 mt-8">
              {streamingState.error}
            </div>
          )}

          {showWatsonChoice && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-8"
            >
              <div className="text-center text-lg text-stone-600">
                Dr. Watson, will you join Holmes in this investigation?
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleWatsonChoice(true)}
                  className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                           transition-colors duration-200 font-medium tracking-wide"
                >
                  Join the Investigation
                </button>
                <button
                  onClick={() => handleWatsonChoice(false)}
                  className="px-6 py-3 border-2 border-stone-800 text-stone-800 rounded-lg 
                           hover:bg-stone-100 transition-colors duration-200 font-medium tracking-wide"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}