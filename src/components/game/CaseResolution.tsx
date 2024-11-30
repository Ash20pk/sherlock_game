import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function CaseResolution() {
  const { 
    setPhase, 
    addDialogue,
    dialogueHistory, 
    deductions,
    evidence 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [resolutionStages, setResolutionStages] = useState<Array<{
    narrative: string
    type: 'revelation' | 'explanation' | 'conclusion'
  }>>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    const generateResolution = async () => {
      try {
        const response = await generateNarrative('CASE_RESOLUTION', {
          phase: 'CASE_RESOLUTION',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
          evidence
        })

        // Add final dialogue
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Create resolution stages
        if (response.narrative) {
          const stages = response.narrative.split('---').map((stage, index) => {
            const type = index === 0 ? 'revelation' 
                      : index === response.narrative.split('---').length - 1 
                        ? 'conclusion' 
                        : 'explanation'
            return {
              narrative: stage.trim(),
              type
            }
          })
          setResolutionStages(stages)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error generating case resolution:', error)
      }
    }

    generateResolution()
  }, [addDialogue, dialogueHistory, deductions, evidence])

  useEffect(() => {
    if (!loading && currentStage < resolutionStages.length) {
      const timer = setTimeout(() => {
        if (currentStage < resolutionStages.length - 1) {
          setCurrentStage(prev => prev + 1)
        } else {
          setShowContinue(true)
        }
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [currentStage, loading, resolutionStages.length])

  if (loading) return <Loading nextPhase="CASE_RESOLUTION" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian resolution ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/resolution-pattern.png')] mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/20 to-transparent" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Resolution sequence */}
          <AnimatePresence mode="wait">
            {resolutionStages[currentStage] && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stage heading */}
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-serif text-stone-800 text-center mb-8"
                >
                  {resolutionStages[currentStage].type === 'revelation' && 'The Truth Revealed'}
                  {resolutionStages[currentStage].type === 'explanation' && 'The Pieces Fall Into Place'}
                  {resolutionStages[currentStage].type === 'conclusion' && 'Case Closed'}
                </motion.h2>

                {/* Narrative */}
                <div className={`prose prose-stone prose-lg max-w-none ${
                  resolutionStages[currentStage].type === 'revelation' 
                    ? 'font-serif text-lg' 
                    : ''
                }`}>
                  <p className="text-stone-800 leading-relaxed">
                    {resolutionStages[currentStage].narrative}
                  </p>
                </div>

                {/* Visual elements based on stage type */}
                {resolutionStages[currentStage].type === 'revelation' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex justify-center"
                  >
                    <div className="w-16 h-1 bg-stone-800" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {resolutionStages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  index === currentStage ? 'bg-stone-800' : 'bg-stone-300'
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
                  onClick={() => setPhase('EPILOGUE')}
                  className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                           hover:bg-stone-700 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Proceed to Epilogue
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
