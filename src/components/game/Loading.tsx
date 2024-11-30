import { motion } from 'framer-motion'
import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameState'

interface LoadingProps {
  nextPhase?: string;
}

export const Loading = ({ nextPhase = 'TITLE_SCREEN' }: LoadingProps) => {
  const { progress, setProgress, setPhase } = useGameStore()

  const completeLoading = useCallback(() => {
    console.log(`Transitioning to ${nextPhase}`)
    setPhase(nextPhase)
  }, [setPhase, nextPhase])

  useEffect(() => {
    console.log('Loading component mounted')
    let mounted = true
    
    const interval = setInterval(() => {
      if (!mounted) return
      
      const newProgress = Math.min(progress + 2, 100)
      console.log('Loading progress:', newProgress)
      setProgress(newProgress)
      
      if (newProgress === 100) {
        clearInterval(interval)
        completeLoading()
      }
    }, 50)

    return () => {
      mounted = false
      clearInterval(interval)
      console.log('Loading component cleanup')
    }
  }, [setProgress, completeLoading, progress])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-8 w-full h-full"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-amber-900">Loading...</h1>
        <p className="text-amber-800">{progress}%</p>
      </div>
      
      <div className="w-64 h-2 bg-amber-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-amber-900"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  )
}
