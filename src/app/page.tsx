'use client'

import { useGameStore } from '@/store/gameState'
import NarratorIntroduction from '@/components/game/NarratorIntroduction'
import HolmesInitialReaction from '@/components/game/HolmesInitialReaction'
import StoryDevelopment from '@/components/game/StoryDevelopment'
import CaseConclusion from '@/components/game/CaseConclusion'

export default function Home() {
  const { phase } = useGameStore()

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-7xl mx-auto">
        {phase === 'NARRATOR_INTRODUCTION' && <NarratorIntroduction />}
        {phase === 'HOLMES_INITIAL_REACTION' && <HolmesInitialReaction />}
        {phase === 'STORY_DEVELOPMENT' && <StoryDevelopment />}
        {phase === 'CASE_CONCLUSION' && <CaseConclusion />}
      </main>
    </div>
  )
}
