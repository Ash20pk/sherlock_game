import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function InvestigationChoice() {
  const { 
    setPhase, 
    addDialogue, 
    availableActions,
    setAvailableActions,
    dialogueHistory, 
    deductions 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [actionDescriptions, setActionDescriptions] = useState<Record<string, string>>({})

  useEffect(() => {
    const generateInvestigationOptions = async () => {
      try {
        const response = await generateNarrative('INVESTIGATION_CHOICE', {
          phase: 'INVESTIGATION_CHOICE',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
          availableActions
        })

        // Add any new dialogue
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Update available actions with descriptions
        if (response.availableActions) {
          setAvailableActions(response.availableActions)
          const descriptions: Record<string, string> = {}
          response.availableActions.forEach(action => {
            descriptions[action.id] = action.description
          })
          setActionDescriptions(descriptions)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error generating investigation options:', error)
      }
    }

    generateInvestigationOptions()
  }, [addDialogue, setAvailableActions, dialogueHistory, deductions, availableActions])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setTimeout(() => {
      setPhase('EVIDENCE_DISCOVERY')
    }, 2000)
  }

  if (loading) return <Loading nextPhase="INVESTIGATION_CHOICE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian investigation ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/investigation-pattern.png')] mix-blend-multiply" />
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-2xl font-serif text-stone-800 text-center mb-8">
            Choose Your Investigation Method
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-colors duration-200
                          ${selectedAction === action.id 
                            ? 'bg-stone-800 text-stone-100 border-stone-800' 
                            : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400'
                          }`}
                onClick={() => handleActionSelect(action.id)}
              >
                <h3 className="font-serif text-lg mb-3">{action.name}</h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  {actionDescriptions[action.id]}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Selected action confirmation */}
          <AnimatePresence>
            {selectedAction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mt-8"
              >
                <p className="text-lg text-stone-600 font-serif italic">
                  Proceeding with investigation...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
