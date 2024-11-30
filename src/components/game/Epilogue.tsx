import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function Epilogue() {
  const { 
    setPhase, 
    addDialogue,
    dialogueHistory, 
    deductions,
    evidence 
  } = useGameStore()
  
  const [loading, setLoading] = useState(true)
  const [epilogueContent, setEpilogueContent] = useState<{
    narrative: string
    reflections: string[]
    finalThoughts: string
  }>({
    narrative: '',
    reflections: [],
    finalThoughts: ''
  })
  const [showReflections, setShowReflections] = useState(false)
  const [showFinalThoughts, setShowFinalThoughts] = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  useEffect(() => {
    const generateEpilogue = async () => {
      try {
        const response = await generateNarrative('EPILOGUE', {
          phase: 'EPILOGUE',
          currentLocation: '221B Baker Street',
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

        // Parse narrative sections
        if (response.narrative) {
          const [narrative, reflections, finalThoughts] = response.narrative.split('---').map(s => s.trim())
          setEpilogueContent({
            narrative,
            reflections: reflections.split('\n').filter(Boolean),
            finalThoughts
          })
        }

        setLoading(false)
        
        // Sequence the epilogue sections
        setTimeout(() => setShowReflections(true), 6000)
        setTimeout(() => setShowFinalThoughts(true), 12000)
        setTimeout(() => setShowReturn(true), 16000)
      } catch (error) {
        console.error('Error generating epilogue:', error)
      }
    }

    generateEpilogue()
  }, [addDialogue, dialogueHistory, deductions, evidence])

  if (loading) return <Loading nextPhase="EPILOGUE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="relative bg-stone-100 p-8 rounded-lg shadow-xl">
        {/* Victorian epilogue ambiance */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/epilogue-pattern.png')] mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/20 to-transparent" />
        </div>

        <div className="relative z-10 space-y-12">
          {/* Main narrative */}
          <div className="prose prose-stone prose-lg max-w-none">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-serif text-stone-800 text-center mb-8"
            >
              Epilogue
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-stone-800 leading-relaxed font-serif"
            >
              {epilogueContent.narrative}
            </motion.p>
          </div>

          {/* Reflections */}
          <AnimatePresence>
            {showReflections && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-serif text-stone-800">
                  Reflections on the Case
                </h3>
                <div className="grid gap-4">
                  {epilogueContent.reflections.map((reflection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.5 }}
                      className="bg-stone-50 p-4 rounded-lg border border-stone-200"
                    >
                      <p className="text-stone-700 italic">{reflection}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final thoughts */}
          <AnimatePresence>
            {showFinalThoughts && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-stone-800 text-stone-100 p-6 rounded-lg"
              >
                <p className="font-serif leading-relaxed">
                  {epilogueContent.finalThoughts}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Return to title */}
          <AnimatePresence>
            {showReturn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('TITLE_SCREEN')}
                  className="px-6 py-3 bg-stone-800 text-stone-100 rounded
                           hover:bg-stone-700 transition-colors duration-200
                           font-serif tracking-wide"
                >
                  Return to Title Screen
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
