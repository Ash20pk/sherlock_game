import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function EvidenceDiscovery() {
  const { 
    setPhase, 
    addDialogue, 
    addEvidence,
    addDeduction,
    dialogueHistory, 
    deductions,
    availableActions
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [discoveryStages, setDiscoveryStages] = useState<Array<{
    description: string
    evidence?: {
      id: string
      name: string
      description: string
      location: string
      discoverer: string
    }
    deduction?: {
      id: string
      content: string
      evidence: string[]
      confidence: number
    }
  }>>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    const generateDiscovery = async () => {
      try {
        const response = await generateNarrative('EVIDENCE_DISCOVERY', {
          phase: 'EVIDENCE_DISCOVERY',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
          availableActions
        })

        // Add dialogue entries
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Add evidence
        if (response.evidence) {
          response.evidence.forEach(evidence => {
            addEvidence(evidence)
          })
        }

        // Add deductions
        if (response.deductions) {
          response.deductions.forEach(deduction => {
            addDeduction(deduction)
          })
        }

        // Create discovery stages
        if (response.narrative) {
          const stages = response.narrative.split('---').map((stage, index) => ({
            description: stage.trim(),
            evidence: response.evidence?.[index],
            deduction: response.deductions?.[index]
          }))
          setDiscoveryStages(stages)
        }

        setLoading(false)
        startDiscoverySequence()
      } catch (error) {
        console.error('Error generating evidence discovery:', error)
      }
    }

    generateDiscovery()
  }, [addDialogue, addEvidence, addDeduction, dialogueHistory, deductions, availableActions])

  const startDiscoverySequence = () => {
    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < discoveryStages.length - 1) {
          return prev + 1
        } else {
          clearInterval(interval)
          setShowContinue(true)
          return prev
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }

  if (loading) return <Loading nextPhase="EVIDENCE_DISCOVERY" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian investigation ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/evidence-pattern.png')] mix-blend-multiply" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Discovery narrative */}
          <AnimatePresence mode="wait">
            {discoveryStages[currentStage] && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Description */}
                <div className="prose prose-stone prose-lg max-w-none">
                  <p className="text-stone-800 leading-relaxed">
                    {discoveryStages[currentStage].description}
                  </p>
                </div>

                {/* Evidence card */}
                {discoveryStages[currentStage].evidence && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-stone-50 p-6 rounded-lg border-2 border-stone-200"
                  >
                    <h3 className="font-serif text-xl text-stone-800 mb-4">
                      Evidence Discovered
                    </h3>
                    <div className="space-y-2">
                      <p className="font-bold">{discoveryStages[currentStage].evidence?.name}</p>
                      <p className="text-stone-600">{discoveryStages[currentStage].evidence?.description}</p>
                      <p className="text-sm text-stone-500 mt-4">
                        Found at: {discoveryStages[currentStage].evidence?.location}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Deduction card */}
                {discoveryStages[currentStage].deduction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2 }}
                    className="bg-stone-800 text-stone-100 p-6 rounded-lg"
                  >
                    <h3 className="font-serif text-xl mb-4">
                      Holmes's Deduction
                    </h3>
                    <p className="italic leading-relaxed">
                      {discoveryStages[currentStage].deduction?.content}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {discoveryStages.map((_, index) => (
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
                  onClick={() => setPhase('DEDUCTION_MOMENT')}
                  className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                           hover:bg-stone-700 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Consider the Evidence
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
