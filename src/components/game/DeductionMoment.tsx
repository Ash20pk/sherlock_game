import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function DeductionMoment() {
  const { 
    setPhase, 
    addDialogue, 
    addDeduction,
    dialogueHistory, 
    deductions,
    evidence 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [deductionStages, setDeductionStages] = useState<Array<{
    narrative: string
    deduction?: {
      id: string
      content: string
      evidence: string[]
      confidence: number
    }
  }>>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [showContinue, setShowContinue] = useState(false)
  const [holmesThinking, setHolmesThinking] = useState(true)

  useEffect(() => {
    const generateDeductions = async () => {
      try {
        const response = await generateNarrative('DEDUCTION_MOMENT', {
          phase: 'DEDUCTION_MOMENT',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
          evidence
        })

        // Add dialogue entries
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Add final deductions
        if (response.deductions) {
          response.deductions.forEach(deduction => {
            addDeduction(deduction)
          })
        }

        // Create deduction stages
        if (response.narrative) {
          const stages = response.narrative.split('---').map((stage, index) => ({
            narrative: stage.trim(),
            deduction: response.deductions?.[index]
          }))
          setDeductionStages(stages)
        }

        setLoading(false)
        // Start Holmes's thinking animation
        setTimeout(() => setHolmesThinking(false), 4000)
      } catch (error) {
        console.error('Error generating deductions:', error)
      }
    }

    generateDeductions()
  }, [addDialogue, addDeduction, dialogueHistory, deductions, evidence])

  useEffect(() => {
    if (!holmesThinking && currentStage < deductionStages.length) {
      const timer = setTimeout(() => {
        if (currentStage < deductionStages.length - 1) {
          setCurrentStage(prev => prev + 1)
        } else {
          setShowContinue(true)
        }
      }, 6000)

      return () => clearTimeout(timer)
    }
  }, [currentStage, holmesThinking, deductionStages.length])

  if (loading) return <Loading nextPhase="DEDUCTION_MOMENT" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl min-h-[500px]">
        {/* Victorian study ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/study-pattern.png')] mix-blend-multiply" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Holmes thinking animation */}
          <AnimatePresence>
            {holmesThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <p className="text-2xl font-serif text-stone-800">
                  Holmes is deep in thought...
                </p>
                <div className="flex justify-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 bg-stone-800 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                    className="w-3 h-3 bg-stone-800 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
                    className="w-3 h-3 bg-stone-800 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deduction sequence */}
          <AnimatePresence mode="wait">
            {!holmesThinking && deductionStages[currentStage] && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Narrative */}
                <div className="prose prose-stone prose-lg max-w-none">
                  <p className="text-stone-800 leading-relaxed font-serif">
                    {deductionStages[currentStage].narrative}
                  </p>
                </div>

                {/* Deduction */}
                {deductionStages[currentStage].deduction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-stone-800 text-stone-100 p-6 rounded-lg"
                  >
                    <h3 className="font-serif text-xl mb-4">Deduction</h3>
                    <p className="italic leading-relaxed">
                      {deductionStages[currentStage].deduction.content}
                    </p>
                    {deductionStages[currentStage].deduction.evidence.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-stone-700">
                        <p className="text-sm text-stone-400 mb-2">Based on:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-stone-300">
                          {deductionStages[currentStage].deduction.evidence.map((ev, index) => (
                            <li key={index}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicators */}
          {!holmesThinking && (
            <div className="flex justify-center gap-2">
              {deductionStages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                    index === currentStage ? 'bg-stone-800' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
          )}

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
                  onClick={() => setPhase('CASE_RESOLUTION')}
                  className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                           hover:bg-stone-700 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Reveal the Solution
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
