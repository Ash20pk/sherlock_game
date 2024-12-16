import { create } from 'zustand'

export type GamePhase = 
  | 'TITLE_SCREEN'
  | 'NARRATOR_INTRODUCTION'
  | 'HOLMES_INITIAL_REACTION'
  | 'STORY_DEVELOPMENT'
  | 'CASE_CONCLUSION'

interface DialogueEntry {
  text: string
  speaker: string
  timestamp: string
}

interface Deduction {
  observation: string
  timestamp: string
}

interface Evidence {
  id: string
  description: string
  discoveredAt: string
  usedIn: string[]
  availableActions: string[]
}

interface Action {
  id: string
  text: string
  type: 'ACTION' | 'RIDDLE' | 'PUZZLE' | 'MEDICAL' | 'OBSERVATION' | 'LOGIC' | 'PHYSICAL'
  action?: {
    text: string
    actionOptions: string[]
  }
  challenge?: {
    question: string
    hints: string[]
    solution: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  }
  requiresEvidence?: string[]
  availableFor: 'HOLMES' | 'WATSON' | 'BOTH'
  reward?: {
    description: string
  }
}

interface GameState {
  phase: GamePhase
  dialogueHistory: DialogueEntry[]
  deductions: Deduction[]
  evidence: Evidence[]
  availableActions: Action[]
  watsonJoined: boolean
  setPhase: (phase: GamePhase) => void
  addDialogue: (entry: DialogueEntry) => void
  addDeduction: (deduction: Deduction) => void
  addEvidence: (evidence: Evidence) => void
  useEvidence: (evidenceId: string, actionId: string) => void
  setAvailableActions: (actions: Action[]) => void
  setWatsonJoined: (joined: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'STORY_DEVELOPMENT',
  dialogueHistory: [],
  deductions: [],
  evidence: [],
  availableActions: [],
  watsonJoined: false,
  setPhase: (phase: GamePhase) => set({ phase }),
  addDialogue: (entry: DialogueEntry) => set((state) => ({
    dialogueHistory: [...state.dialogueHistory, entry],
  })),
  addDeduction: (deduction: Deduction) => set((state) => ({
    deductions: [...state.deductions, deduction],
  })),
  addEvidence: (evidence: Evidence) => set((state) => ({
    evidence: [...state.evidence, {
      ...evidence,
      usedIn: evidence.usedIn || [],
      availableActions: evidence.availableActions || [],
      discoveredAt: evidence.discoveredAt || new Date().toISOString()
    }],
  })),
  useEvidence: (evidenceId: string, actionId: string) => set((state) => ({
    evidence: state.evidence.map(e => 
      e.id === evidenceId 
        ? { ...e, usedIn: Array.isArray(e.usedIn) ? [...e.usedIn, actionId] : [actionId] }
        : e
    )
  })),
  setAvailableActions: (actions: Action[]) => set({ availableActions: actions }),
  setWatsonJoined: (joined: boolean) => set({ watsonJoined: joined }),
}))
