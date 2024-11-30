import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative, createDialogueEntry, createDeductionEntry } from '@/utils/narrative'
import { Loading } from './Loading'

export default function SceneDescription() {
  const { 
    setPhase, 
    addDialogue, 
    addDeduction, 
    setAvailableActions,
    dialogueHistory, 
    deductions 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [sceneElements, setSceneElements] = useState<{
    description: string[]
    observations: string[]
    atmosphere: string[]
  }>({
    description: [],
    observations: [],
    atmosphere: []
  })
  const [currentSection, setCurrentSection] = useState<'description' | 'observations' | 'atmosphere'>('description')
  const [showInvestigationOptions, setShowInvestigationOptions] = useState(false)

  useEffect(() => {
    const generateSceneDescription = async () => {
      try {
        const response = await generateNarrative('SCENE_DESCRIPTION', {
          phase: 'SCENE_DESCRIPTION',
          currentLocation: 'Berkeley Square',
          dialogueHistory,
          deductions,
        })

        // Add scene dialogue
        if (response.dialogueEntries) {
          response.dialogueEntries.forEach(entry => {
            addDialogue(entry)
          })
        }

        // Add initial scene deductions
        if (response.deductions) {
          response.deductions.forEach(deduction => {
            addDeduction(deduction)
          })
        }

        // Set available investigation actions
        if (response.availableActions) {
          setAvailableActions(response.availableActions)
        }

        // Parse narrative into sections
        if (response.narrative) {
          const sections = response.narrative.split('---').map(s => s.trim())
          setSceneElements({
            description: sections[0]?.split('\n\n').filter(Boolean) || [],
            observations: sections[1]?.split('\n\n').filter(Boolean) || [],
            atmosphere: sections[2]?.split('\n\n').filter(Boolean) || []
          })
        }

        setLoading(false)
        startSceneSequence()
      } catch (error) {
        console.error('Error generating scene description:', error)
      }
    }

    generateSceneDescription()
  }, [addDialogue, addDeduction, setAvailableActions, dialogueHistory, deductions])

  const startSceneSequence = () => {
    // Sequence through sections
    setTimeout(() => setCurrentSection('observations'), 8000)
    setTimeout(() => setCurrentSection('atmosphere'), 16000)
    setTimeout(() => setShowInvestigationOptions(true), 24000)
  }

  const renderSection = (
    section: 'description' | 'observations' | 'atmosphere',
    title: string,
    elements: string[]
  ) => (
    <motion.div
      key={section}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-serif text-stone-800 mb-6">{title}</h2>
      {elements.map((element, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.5 }}
          className="text-stone-700 leading-relaxed font-serif"
        >
          {element}
        </motion.p>
      ))}
    </motion.div>
  )

  if (loading) return <Loading nextPhase="SCENE_DESCRIPTION" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian crime scene ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/crime-scene-pattern.png')] mix-blend-multiply" />
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-900/20 to-transparent" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Scene sections */}
          <AnimatePresence mode="wait">
            {currentSection === 'description' && (
              renderSection('description', 'The Scene Unfolds', sceneElements.description)
            )}
            {currentSection === 'observations' && (
              renderSection('observations', 'Initial Observations', sceneElements.observations)
            )}
            {currentSection === 'atmosphere' && (
              renderSection('atmosphere', 'The Atmosphere', sceneElements.atmosphere)
            )}
          </AnimatePresence>

          {/* Section indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {(['description', 'observations', 'atmosphere'] as const).map((section) => (
              <div
                key={section}
                className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                  currentSection === section ? 'bg-stone-800' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>

          {/* Investigation options */}
          <AnimatePresence>
            {showInvestigationOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <h3 className="font-serif text-xl text-stone-800">
                  How shall we proceed with the investigation?
                </h3>
                <div className="flex gap-4">
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase('HOLMES_WATSON_DIALOGUE')}
                    className="px-6 py-3 border-2 border-stone-800 text-stone-800 rounded
                             hover:bg-stone-200 transition-colors duration-200
                             font-serif tracking-wide"
                  >
                    Consult with Holmes
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
