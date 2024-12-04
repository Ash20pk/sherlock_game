'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'

export default function TitleScreen() {
  const { setPhase } = useGameStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-12 w-full h-screen bg-gradient-to-b from-stone-800 to-stone-900"
    >
      <div className="text-center">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-4xl sm:text-6xl font-bold text-stone-100 mb-4 font-serif"
        >
          Sherlock Holmes
        </motion.h1>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-lg text-center space-y-4 text-stone-300 px-4"
      >
        <p className="text-lg">
          Step into the fog-laden streets of Victorian London and join the world's
          greatest detective in solving a most peculiar case.
        </p>
        <p>
          Use your powers of observation and deduction to uncover the truth behind
          a mysterious cases.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setPhase('NARRATOR_INTRODUCTION')}
        className="px-8 py-4 bg-amber-800 text-stone-100 rounded-lg
                 hover:bg-amber-700 transition-colors duration-200
                 font-serif text-lg tracking-wide shadow-lg"
      >
        Begin the Investigation
      </motion.button>
    </motion.div>
  )
}
