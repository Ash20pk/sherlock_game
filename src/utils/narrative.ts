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
  chapterTitle?: string
  rawNarrative?: string
  displayNarrative?: string
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

export function parseStreamingContent(content: string) {
  const result: Partial<NarrativeResponse> = {};
  let narrative = content;

  // Extract chapter title
  const chapterMatch = content.match(/###CHAPTER###([^#]+)/);
  if (chapterMatch) {
    result.chapterTitle = chapterMatch[1].trim();
    narrative = narrative.replace(/###CHAPTER###[^#]+/, '');
  }

  // Extract narrative
  const narrativeMatch = content.match(/###NARRATIVE###([^#]+)/);
  if (narrativeMatch) {
    result.narrative = narrativeMatch[1].trim();
    narrative = narrative.replace(/###NARRATIVE###[^#]+/, '');
  }

  // Extract dialogue
  const dialogueMatch = content.match(/###DIALOGUE###(\[.*?\])/s);
  if (dialogueMatch) {
    try {
      result.dialogueEntries = JSON.parse(dialogueMatch[1]);
      narrative = narrative.replace(/###DIALOGUE###\[.*?\]/s, '');
    } catch (e) {}
  }

  // Extract deductions
  const deductionsMatch = content.match(/###DEDUCTIONS###(\[.*?\])/s);
  if (deductionsMatch) {
    try {
      result.deductions = JSON.parse(deductionsMatch[1]);
      narrative = narrative.replace(/###DEDUCTIONS###\[.*?\]/s, '');
    } catch (e) {}
  }

  // Extract evidence
  const evidenceMatch = content.match(/###EVIDENCE###(\[.*?\])/s);
  if (evidenceMatch) {
    try {
      result.evidence = JSON.parse(evidenceMatch[1]);
      narrative = narrative.replace(/###EVIDENCE###\[.*?\]/s, '');
    } catch (e) {}
  }

  // Extract actions
  const actionsMatch = content.match(/###ACTIONS###(\[.*?\])/s);
  if (actionsMatch) {
    try {
      result.availableActions = JSON.parse(actionsMatch[1]);
      narrative = narrative.replace(/###ACTIONS###\[.*?\]/s, '');
    } catch (e) {}
  }

  // Clean up any remaining markers
  narrative = narrative.replace(/###[A-Z]+###/g, '');

  return {
    ...result,
    rawNarrative: content,
    displayNarrative: narrative.trim()
  };
}
