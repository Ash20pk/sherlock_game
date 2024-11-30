import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState } from 'react'

const Telegram = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const { setPhase } = useGameStore()

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index])
        index++
      } else {
        setIsComplete(true)
        onComplete()
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [text, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full mx-auto"
    >
      {/* Telegram outer frame */}
      <div className="bg-amber-100 p-6 rounded-lg shadow-xl border-4 border-amber-900/20">
        {/* Header with decorative elements */}
        <div className="text-center mb-6 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-900/20" />
          <div className="py-4">
            <h2 className="text-amber-900 text-2xl font-bold tracking-widest mb-1">TELEGRAM</h2>
            <div className="flex items-center justify-center gap-2 text-amber-800/70">
              <span className="text-sm uppercase tracking-wider">British Postal Telegraph</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-900/20" />
        </div>

        {/* Telegram details */}
        <div className="mb-4 flex justify-between text-amber-800/80 text-sm">
          <div>
            <p>TO: Sherlock Holmes, Esq.</p>
            <p>221B Baker Street, London</p>
          </div>
          <div className="text-right">
            <p>URGENT</p>
            <p>No. 1895</p>
          </div>
        </div>

        {/* Main content with aged paper effect */}
        <div className="bg-amber-50/80 p-6 rounded border border-amber-900/10 shadow-inner mb-6">
          <p className="font-mono text-amber-900 leading-relaxed whitespace-pre-line relative">
            {displayedText}
            <motion.span
              animate={{ opacity: isComplete ? 0 : 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute"
            >
              |
            </motion.span>
          </p>
        </div>

        {/* Footer with decorative elements */}
        <div className="border-t border-amber-900/20 pt-4 flex justify-between items-center">
          <div className="text-amber-800/70 text-sm">
            <p>Received: {new Date().toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric'
            })}</p>
          </div>
          {isComplete && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-2 bg-amber-900 text-amber-50 rounded
                       hover:bg-amber-800 transition-colors duration-200
                       font-semibold tracking-wide shadow-lg"
              onClick={() => setPhase('HOLMES_INITIAL_REACTION')}
            >
              Read Holmes's Reaction
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export const CaseIntroduction = () => {
  const telegramText = `Most peculiar case at hand. Prominent antiquarian found dead in study.

Room locked from inside. No signs of forced entry.
Ancient Egyptian artifact missing from collection.
Inspector Lestrade baffled.

Your presence requested immediately at 42 Berkeley Square.

- Superintendent Morton`

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Telegram
        text={telegramText}
        onComplete={() => {
          console.log('Telegram animation complete')
        }}
      />
    </div>
  )
}
