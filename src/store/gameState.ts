import { create } from 'zustand'

export type GamePhase = 
  | 'NARRATOR_INTRODUCTION'
  | 'HOLMES_INITIAL_REACTION'
  | 'STORY_DEVELOPMENT'
  | 'HOLMES_INVESTIGATION'
  | 'CASE_CONCLUSION'

interface DialogueEntry {
  text: string
  speaker: string
  timestamp: string
}

interface Deduction {
  conclusion: string
  observation: string
  timestamp: string
  author: 'HOLMES' | 'WATSON'
}

interface Evidence {
  id: string
  type: string
  title: string
  description: string
  discoveredAt: string
  usedIn: string[]
  availableActions: string[]
}

interface Action {
  id: string
  text: string
  type: 'INVESTIGATE' | 'USE_EVIDENCE' | 'QUESTION' | 'EXAMINE'
  requiresEvidence?: string[]
  availableFor: 'HOLMES' | 'WATSON' | 'BOTH'
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
  phase: 'NARRATOR_INTRODUCTION',
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
