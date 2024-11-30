import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative, createDialogueEntry } from '@/utils/narrative'
import { Loading } from './Loading'

export default function HolmesWatsonDialogue() {
  const { 
    setPhase, 
    addDialogue, 
    dialogueHistory, 
    deductions 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [currentDialogue, setCurrentDialogue] = useState<Array<{
    speaker: string
    text: string
  }>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    const generateDialogue = async () => {
      try {
        const response = await generateNarrative('HOLMES_WATSON_DIALOGUE', {
          phase: 'HOLMES_WATSON_DIALOGUE',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
        })

        // Add dialogue entries
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
          setCurrentDialogue(response.dialogueEntries.map(entry => ({
            speaker: entry.speaker,
            text: entry.content
          })))
        }

        setLoading(false)
      } catch (error) {
        console.error('Error generating dialogue:', error)
      }
    }

    generateDialogue()
  }, [addDialogue, dialogueHistory, deductions])

  useEffect(() => {
    if (!loading && currentIndex < currentDialogue.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 3000)

      return () => clearTimeout(timer)
    } else if (currentIndex === currentDialogue.length) {
      setShowContinue(true)
    }
  }, [currentIndex, loading, currentDialogue.length])

  if (loading) return <Loading nextPhase="HOLMES_WATSON_DIALOGUE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian dialogue ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/dialogue-pattern.png')] mix-blend-multiply" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Dialogue exchange */}
          <div className="space-y-6">
            {currentDialogue.slice(0, currentIndex).map((dialogue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: dialogue.speaker === 'HOLMES' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${
                  dialogue.speaker === 'HOLMES' ? 'items-start' : 'items-end'
                }`}
              >
                <div className={`max-w-[80%] ${
                  dialogue.speaker === 'HOLMES' 
                    ? 'bg-stone-800 text-stone-100' 
                    : 'bg-stone-200 text-stone-800'
                } p-4 rounded-lg`}>
                  <p className="text-sm font-serif mb-2 opacity-80">
                    {dialogue.speaker === 'HOLMES' ? 'Sherlock Holmes' : 'Dr. Watson'}
                  </p>
                  <p className="leading-relaxed">{dialogue.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Continue button */}
          <AnimatePresence>
            {showContinue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('INVESTIGATION_CHOICE')}
                  className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                           hover:bg-stone-700 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Begin Investigation
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
