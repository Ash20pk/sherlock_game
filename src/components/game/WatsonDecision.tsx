import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative, createDialogueEntry } from '@/utils/narrative'
import { Loading } from './Loading'

export default function WatsonDecision() {
  const { setPhase, addDialogue, dialogueHistory, deductions } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [showChoices, setShowChoices] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [watsonThoughts, setWatsonThoughts] = useState<string[]>([])

  useEffect(() => {
    const generateWatsonScene = async () => {
      try {
        const response = await generateNarrative('WATSON_DECISION', {
          phase: 'WATSON_DECISION',
          currentLocation: '221B Baker Street',
          dialogueHistory,
          deductions,
        })

        // Add Watson's dialogue
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Set Watson's internal thoughts
        if (response.narrative) {
          setWatsonThoughts(response.narrative.split('\n\n').filter(Boolean))
        }

        setLoading(false)
        // Show choices after a delay
        setTimeout(() => setShowChoices(true), 3000)
      } catch (error) {
        console.error('Error generating Watson scene:', error)
      }
    }

    generateWatsonScene()
  }, [addDialogue, dialogueHistory, deductions])

  const handleChoice = async (choice: string) => {
    setSelectedChoice(choice)
    
    // Add Watson's decision to dialogue history
    const decisionDialogue = choice === 'join' 
      ? "I must say, Holmes, this case does intrigue me. You can count on my assistance."
      : "I'm afraid I have pressing matters at my practice, Holmes. Perhaps next time."
    
    addDialogue(createDialogueEntry('WATSON', decisionDialogue))
    
    // Transition to next phase after a delay
    setTimeout(() => {
      setPhase(choice === 'join' ? 'JOURNEY_TO_SCENE' : 'TITLE_SCREEN')
    }, 2000)
  }

  if (loading) return <Loading nextPhase="WATSON_DECISION" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian medical office ambiance */}
        <div className="absolute inset-0 opacity-10 bg-[url('/medical-pattern.png')] mix-blend-multiply" />

        <div className="relative z-10 space-y-8">
          {/* Watson's thoughts */}
          <div className="prose prose-stone prose-lg max-w-none space-y-6">
            {watsonThoughts.map((thought, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.5 }}
                className="text-stone-800 leading-relaxed"
              >
                {thought}
              </motion.p>
            ))}
          </div>

          {/* Decision choices */}
          <AnimatePresence>
            {showChoices && !selectedChoice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-4 items-center mt-8"
              >
                <h3 className="font-serif text-xl text-stone-800 mb-2">
                  What shall you do, Dr. Watson?
                </h3>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('join')}
                    className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                             hover:bg-stone-700 transition-colors duration-200
                             font-serif tracking-wide"
                  >
                    Join the Investigation
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('decline')}
                    className="px-6 py-3 border-2 border-stone-800 text-stone-800 rounded
                             hover:bg-stone-200 transition-colors duration-200
                             font-serif tracking-wide"
                  >
                    Decline Politely
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Watson's response after choice */}
          <AnimatePresence>
            {selectedChoice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mt-8"
              >
                <p className="text-lg text-stone-800 font-serif italic">
                  {selectedChoice === 'join'
                    ? "You decide to accompany Holmes on this intriguing case..."
                    : "You regretfully decline Holmes's invitation..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
