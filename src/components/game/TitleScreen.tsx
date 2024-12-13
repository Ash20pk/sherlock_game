'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { Pocket, BookOpen, Feather } from 'lucide-react'

export default function TitleScreen() {
  const { setPhase } = useGameStore()
  const [isHovering, setIsHovering] = useState(false)

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-stone-100 p-4"
    >
      {/* Victorian decorative border */}
      <div className="absolute inset-0 border-8 border-double border-amber-800/30 m-4 pointer-events-none" />
      
      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-amber-700/50" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-amber-700/50" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-amber-700/50" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-amber-700/50" />

      <motion.div 
        className="text-center mb-12"
        variants={fadeIn}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative inline-block"
        >
          <h1 className="text-5xl sm:text-7xl font-bold font-serif text-amber-100 tracking-wider mb-4">
            Sherlock Holmes
          </h1>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl text-stone-400 font-serif mt-4"
        >
          A Victorian Mystery
        </motion.h2>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-2xl text-center space-y-6 mb-12 px-4"
      >
        <p className="text-lg sm:text-xl text-stone-300 leading-relaxed">
          Step into the fog-laden streets of Victorian London and join the world's
          greatest detective in solving a most peculiar case.
        </p>
        <div className="flex flex-wrap justify-center gap-8 text-stone-400 mt-8">
          <div className="flex items-center gap-2">
            <Pocket className="w-5 h-5 text-amber-700" />
            <span>Gather Evidence</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <span>Study Clues</span>
          </div>
          <div className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-amber-700" />
            <span>Solve Mysteries</span>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setPhase('NARRATOR_INTRODUCTION')}
        className="relative group px-10 py-4 bg-gradient-to-r from-amber-900 to-amber-800 
                   rounded-sm text-stone-100 font-serif text-lg tracking-wide
                   transition-all duration-300 hover:from-amber-800 hover:to-amber-700
                   hover:shadow-xl hover:shadow-amber-900/20"
      >
        <motion.span
          animate={{ opacity: isHovering ? 1 : 0 }}
          className="absolute inset-0 border border-amber-600/30 rounded-sm"
        />
        Begin the Investigation
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 text-stone-500 text-sm"
      >
        Press ESC at any time to pause
      </motion.div>
    </motion.div>
  )
}