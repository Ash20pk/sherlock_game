import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef } from 'react'
import { generateNarrative } from '@/utils/narrative'
import {Loading} from './Loading'

export default function HolmesObservation() {
  const { setPhase, addDeduction } = useGameStore()
  const [fullNarrative, setFullNarrative] = useState('')
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(false)

  useEffect(() => {
    const fetchNarrative = async () => {
      if (isMounted.current) return
      isMounted.current = true
      
      try {
        const response = await generateNarrative('HOLMES_INITIAL_REACTION')
        setFullNarrative(response.narrative)
        
        // Add initial deduction
        if (response.deductions?.[0]) {
          addDeduction({
            ...response.deductions[0],
            timestamp: new Date().toISOString()
          })
        } else {
          // Fallback deduction if none provided
          addDeduction({
            observation: "The victim's study shows signs of a hasty departure",
            conclusion: "The perpetrator was interrupted or in a hurry",
            confidence: 0.7,
            timestamp: new Date().toISOString()
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error generating Holmes observation:', error)
        setLoading(false)
      }
    }

    fetchNarrative()

    return () => {
      isMounted.current = false
    }
  }, [addDeduction])

  useEffect(() => {
    if (!fullNarrative || loading) return

    let index = 0
    const timer = setInterval(() => {
      if (index < fullNarrative.length) {
        setDisplayedText(prev => prev + fullNarrative[index])
        index++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, 50) // Adjust speed here

    return () => clearInterval(timer)
  }, [fullNarrative, loading])

  if (loading) return <Loading nextPhase="HOLMES_INITIAL_REACTION" />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="bg-stone-100 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-stone-900">
          Holmes's Initial Reaction
        </h2>
        
        <div className="prose prose-stone prose-lg">
          {displayedText.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-stone-800 leading-relaxed">
              {paragraph}
              {index === displayedText.split('\n\n').length - 1 && !isComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                >
                  |
                </motion.span>
              )}
            </p>
          ))}
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 border-t border-stone-200 pt-6"
          >
            <div className="bg-stone-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Initial Deduction</h3>
              <p className="text-stone-700 italic mb-2">"{displayedText && 'The victim's study shows signs of a hasty departure'}"</p>
              <p className="text-stone-600">Conclusion: The perpetrator was interrupted or in a hurry</p>
            </div>
            
            <motion.button
              onClick={() => setPhase('WATSON_DECISION')}
              className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
              Consult with Watson
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
