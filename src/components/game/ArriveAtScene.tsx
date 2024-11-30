import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'
import { generateNarrative } from '@/utils/narrative'
import { Loading } from './Loading'

export default function ArriveAtScene() {
  const { setPhase } = useGameStore()
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNarrative = async () => {
      try {
        const response = await generateNarrative('ARRIVE_AT_SCENE')
        setNarrative(response.narrative)
        setLoading(false)
      } catch (error) {
        console.error('Error generating arrival scene:', error)
      }
    }

    fetchNarrative()
  }, [])

  if (loading) return <Loading nextPhase="ARRIVE_AT_SCENE" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="bg-stone-100 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-stone-900">
          Arriving at Berkeley Square
        </h2>
        
        <div className="prose prose-stone prose-lg">
          {narrative.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-stone-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => setPhase('EXAMINE_SCENE')}
          className="mt-8 px-6 py-3 bg-stone-800 text-stone-100 rounded
                   hover:bg-stone-700 transition-colors duration-200 mx-auto block"
        >
          Begin Investigation
        </motion.button>
      </div>
    </motion.div>
  )
}
