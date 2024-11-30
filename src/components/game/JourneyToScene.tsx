import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative, createDialogueEntry } from '@/utils/narrative'
import { Loading } from './Loading'

export default function JourneyToScene() {
  const { setPhase, addDialogue, setCurrentLocation, dialogueHistory, deductions } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [journeyStages, setJourneyStages] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [showContinue, setShowContinue] = useState(false)
  const [backgroundClass, setBackgroundClass] = useState('bg-stone-900')

  useEffect(() => {
    const generateJourneyNarrative = async () => {
      try {
        const response = await generateNarrative('JOURNEY_TO_SCENE', {
          phase: 'JOURNEY_TO_SCENE',
          currentLocation: 'En route to Berkeley Square',
          dialogueHistory,
          deductions,
        })

        // Add journey dialogue
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Split narrative into journey stages
        if (response.narrative) {
          setJourneyStages(response.narrative.split('\n\n').filter(Boolean))
        }

        setLoading(false)
        // Start journey animation sequence
        startJourneySequence()
      } catch (error) {
        console.error('Error generating journey narrative:', error)
      }
    }

    generateJourneyNarrative()
  }, [addDialogue, dialogueHistory, deductions])

  const startJourneySequence = () => {
    // Sequence of background changes to represent journey
    const backgrounds = [
      'bg-gradient-to-b from-stone-800 to-stone-900', // Evening departure
      'bg-gradient-to-b from-stone-700 to-stone-800', // Foggy streets
      'bg-gradient-to-b from-stone-600 to-stone-700', // Gas-lit thoroughfare
      'bg-gradient-to-b from-stone-500 to-stone-600', // Approaching destination
    ]

    let stage = 0
    const interval = setInterval(() => {
      if (stage < journeyStages.length) {
        setCurrentStage(stage)
        setBackgroundClass(backgrounds[stage % backgrounds.length])
        stage++
      } else {
        clearInterval(interval)
        setShowContinue(true)
        setCurrentLocation('Berkeley Square')
      }
    }, 4000) // 4 seconds per stage

    return () => clearInterval(interval)
  }

  if (loading) return <Loading nextPhase="JOURNEY_TO_SCENE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen w-full transition-colors duration-1000 ${backgroundClass}`}
    >
      <div className="max-w-4xl mx-auto p-8">
        <div className="relative">
          {/* Victorian street elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-1 h-full bg-yellow-200 blur-sm" /> {/* Gas lamp light */}
            <div className="absolute top-0 right-1/4 w-1 h-full bg-yellow-200 blur-sm" /> {/* Gas lamp light */}
          </div>

          {/* Journey narrative */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 bg-stone-900/40 p-8 rounded-lg backdrop-blur-sm"
            >
              <div className="prose prose-invert prose-lg max-w-none">
                <motion.p
                  className="text-stone-100 leading-relaxed font-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {journeyStages[currentStage]}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {journeyStages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  index === currentStage ? 'bg-stone-100' : 'bg-stone-600'
                }`}
              />
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
                  onClick={() => setPhase('SCENE_DESCRIPTION')}
                  className="px-6 py-3 bg-stone-100 text-stone-900 rounded
                           hover:bg-stone-200 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Arrive at Berkeley Square
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
