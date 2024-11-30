import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function ExamineScene() {
  const { setPhase, addEvidence } = useGameStore()
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNarrative = async () => {
      try {
        const response = await generateNarrative('EXAMINE_SCENE')
        setNarrative(response.narrative)
        setLoading(false)

        // Add initial evidence from the scene examination
        addEvidence({
          id: 'study-layout',
          type: 'observation',
          title: 'Study Layout',
          description: 'The professor\'s study is meticulously organized, with books arranged by subject. The desk faces away from the window, suggesting the professor valued privacy while working.',
          discovered: true,
          analyzed: false
        })

        addEvidence({
          id: 'locked-room',
          type: 'observation',
          title: 'Locked Room Mystery',
          description: 'The study door was locked from the inside, with no obvious means of exit. The windows were also secured.',
          discovered: true,
          analyzed: false
        })
      } catch (error) {
        console.error('Error generating scene examination:', error)
      }
    }

    fetchNarrative()
  }, [addEvidence])

  if (loading) return <Loading nextPhase="EXAMINE_SCENE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="bg-stone-100 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-stone-900">
          Examining the Scene
        </h2>
        
        <div className="prose prose-stone prose-lg">
          {narrative.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-stone-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-stone-800">Initial Observations</h3>
          <ul className="list-disc pl-5 space-y-2 text-stone-700">
            <li>The study door was locked from the inside</li>
            <li>Books are meticulously organized by subject</li>
            <li>The desk is positioned away from the window</li>
            <li>All windows were securely fastened</li>
          </ul>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => setPhase('WATSON_ANALYSIS')}
          className="mt-8 px-6 py-3 bg-stone-800 text-stone-100 rounded
                   hover:bg-stone-700 transition-colors duration-200 mx-auto block"
        >
          Request Watson's Analysis
        </motion.button>
      </div>
    </motion.div>
  )
}
