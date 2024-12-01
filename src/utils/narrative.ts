import { GamePhase, Evidence, DialogueEntry, DeductionEntry } from '@/store/gameState'

export interface NarrativeResponse {
  narrative: string
  phase: GamePhase
  timestamp: string
  dialogueEntries?: DialogueEntry[]
  deductions?: DeductionEntry[]
  availableActions?: string[]
  evidence?: Evidence[]
  challenge?: {
    type: 'action' | 'riddle' | 'puzzle' | 'medical' | 'observation'
    question: string
    hints: string[]
    solution: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  }
  selectedAction?: {
    id: string
    result: string
    unlockedEvidence?: Evidence[]
    unlockedDeductions?: DeductionEntry[]
  }
}

export interface NarrativeContext {
  phase: GamePhase
  currentLocation?: string
  selectedAction?: string
  selectedSolution?: string
  evidence?: Evidence[]
  recentDialogue?: DialogueEntry[]
  recentDeductions?: DeductionEntry[]
  recentActions?: string[]
}

export async function generateNarrative(
  phase: GamePhase,
  context?: NarrativeContext
): Promise<NarrativeResponse> {
  try {
    const response = await fetch('/api/narrative', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phase,
        context
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate narrative')
    }

    return await response.json()
  } catch (error) {
    console.error('Narrative generation error:', error)
    throw error
  }
}

// Helper function to format narrative text with proper spacing and styling
export function formatNarrative(text: string): string {
  return text
    .trim()
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/([.!?])\s+/g, '$1\n') // Add newline after each sentence
}

// Helper to create a dialogue entry
export function createDialogueEntry(
  speaker: DialogueEntry['speaker'],
  text: string
): DialogueEntry {
  return {
    speaker,
    text,
    timestamp: new Date().toISOString()
  }
}

// Helper to create a deduction entry
export function createDeductionEntry(
  observation: string,
  conclusion: string,
  confidence: number
): DeductionEntry {
  return {
    observation,
    conclusion,
    confidence,
    timestamp: new Date().toISOString()
  }
}
