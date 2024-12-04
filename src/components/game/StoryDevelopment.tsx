import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'
import { Action, Evidence, DeductionEntry } from '@/store/gameState'
import EvidenceReport  from './EvidenceReport'
import { Loading } from './Loading'

interface ChatItem {
  id: string;
  type: 'narrative' | 'dialogue' | 'deduction' | 'evidence' | 'chapter-title';
  text: string;
  currentText: string;
  speaker?: string;
  isComplete: boolean;
  evidence?: Evidence;
  chapterNumber?: number;
}

const EvidenceDisplay: React.FC<{ evidence: Evidence }> = ({ evidence }) => {
  return (
    <div className="p-3 border-2 rounded-lg">
      <div className="font-medium text-stone-900">{evidence.title}</div>
      <div className="text-stone-700 mt-1">
        {typeof evidence.content === 'object' && evidence.content.text ? evidence.content.text : evidence.content}
      </div>
      <div className="text-sm text-stone-500 mt-2">Type: {evidence.type}</div>
    </div>
  );
};

const StoryBlock = ({ 
  type,
  text,
  speaker,
  isTyping,
  evidence
}: {
  type: string;
  text: string;
  speaker?: string;
  isTyping: boolean;
  evidence?: Evidence;
}) => {
  const getTextStyle = () => {
    switch (type) {
      case 'narrative':
      case 'chapter-title':
        return 'text-stone-800 font-serif';
      case 'dialogue':
        return 'text-stone-900';
      case 'evidence':
        return 'text-amber-800';
      case 'deduction':
        return 'text-stone-800 italic';
      default:
        return 'text-stone-800';
    }
  };

  const getBlockStyle = () => {
    switch (type) {
      case 'chapter-title':
        return 'mb-8 text-center text-2xl';
      case 'narrative':
        return 'mb-6';
      case 'deduction':
        return 'mt-6 mb-6 pl-4 border-l-4 border-stone-300';
      case 'dialogue':
        return 'mb-6';
      default:
        return 'mb-3';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={getBlockStyle()}
    >
      {type === 'dialogue' && speaker && (
        <div className="text-stone-600 mb-1 tracking-wide font-medium">
          {speaker}:
        </div>
      )}
      <div className={`${getTextStyle()} leading-relaxed text-lg`}>
        {type === 'dialogue' ? `"${text}"` : text}
        {isTyping && (
          <span className="inline-block w-1 h-4 ml-1 bg-stone-400 animate-pulse" />
        )}
      </div>
    </motion.div>
  );
};

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const getColor = () => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
      {difficulty}
    </span>
  );
};


const EvidenceItem: React.FC<{ evidence: Evidence }> = ({ evidence }) => {
  const { availableActions } = useGameStore();
  const [showDetails, setShowDetails] = useState(false);
  const [evidenceDetails, setEvidenceDetails] = useState<{
    metadata?: {
      caseNumber: string;
      date: string;
      location: string;
    };
    description?: string;
    content?: string;
    analysis?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadEvidenceDetails = useCallback(async () => {
    if (!evidenceDetails.content && !isLoading && availableActions.length > 0) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/evidence/${evidence.id}?` + new URLSearchParams({
            type: evidence.type,
            title: evidence.title,
            content: evidence.content || '',
            solution: evidence.solution || ''
          })
        );
        const data = await response.json();
        setEvidenceDetails(data);
      } catch (error) {
        console.error('Error loading evidence details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [evidence, evidenceDetails.content, isLoading, availableActions]);

  const loadHolmesAnalysis = async () => {
    if (!evidenceDetails.analysis && !isLoadingAnalysis) {
      setIsLoadingAnalysis(true);
      try {
        const response = await fetch(
          `/api/evidence/${evidence.id}/analysis?` + new URLSearchParams({
            content: contentRef.current?.innerText || '',
            solution: evidence.solution || ''
          })
        );
        const data = await response.json();
        setEvidenceDetails(prev => ({
          ...prev,
          analysis: data.analysis
        }));
      } catch (error) {
        console.error('Error loading Holmes analysis:', error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    }
  };

  useEffect(() => {
    if (availableActions.length > 0) {
      loadEvidenceDetails();
    }
  }, [availableActions, loadEvidenceDetails]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-left p-3 rounded-lg bg-stone-50 hover:bg-stone-100 
                   border-2 border-stone-200 transition-colors duration-200"
      >
        <div className="font-medium text-stone-900">{evidence.title}</div>
        {isLoading && (
          <div className="text-sm text-stone-500">Loading evidence details...</div>
        )}
      </button>

      {showDetails && evidenceDetails.metadata && evidenceDetails.content && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetails(false);
            }
          }}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {isLoading ? (
              <div className="text-center py-8 text-stone-500">
                Loading evidence details...
              </div>
            ) : (
              <div>
                <div ref={contentRef}>
                  <EvidenceReport
                    metadata={evidenceDetails.metadata}
                    description={evidenceDetails.description || ''}
                    content={evidenceDetails.content}
                  />
                </div>
                
                <div className="p-4 bg-stone-100 border-t border-stone-200">
                  <button
                    onClick={loadHolmesAnalysis}
                    disabled={isLoadingAnalysis}
                    className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg 
                             hover:bg-stone-700 transition-colors duration-200
                             disabled:bg-stone-400"
                  >
                    {isLoadingAnalysis ? 'Loading Analysis...' : 'Ask Holmes'}
                  </button>

                  {evidenceDetails.analysis && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 bg-white rounded-lg border border-stone-200"
                    >
                      <h4 className="text-stone-800 font-medium mb-2">Holmes's Analysis</h4>
                      <p className="text-stone-600 italic">{evidenceDetails.analysis}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

const ChallengeCard: React.FC<{
  action: Action;
  onSolve: () => void;
  evidence?: Evidence[];
  onChapterProgress: (actionContext?: {
    type: 'ACTION' | 'RIDDLE' | 'PUZZLE' | 'MEDICAL' | 'OBSERVATION' | 'LOGIC' | 'PHYSICAL';
    text?: string;
    chosenAction?: string;
    question?: string;
    solution?: string;
  }) => void;
}> = ({ action, onSolve, evidence, onChapterProgress }) => {
  const [attempt, setAttempt] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Calculate similarity between two strings (0 to 1)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Convert strings to sets of words
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    
    // Calculate intersection
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    
    // Calculate Jaccard similarity
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const handleSubmit = () => {
    const similarity = calculateSimilarity(attempt, action.challenge?.solution || '');
    // Consider it correct if similarity is above 0.1 (10% similar)
    if (similarity >= 0.1) {
      setIsCorrect(true);
      onSolve();
      // Progress to next chapter
      onChapterProgress({
        type: action.type,
        question: action.challenge?.question || action.text,
        solution: attempt
      });
    } else {
      // Optional: Add feedback for incorrect answers
      alert("That's not quite right. Try again!");
    }
  };

  // Handle ACTION type differently
  if (action.type === 'ACTION') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-sm border-2 border-stone-100"
      >
        {evidence && evidence.length > 0 && (
          <div className="mb-6">
            <div className="text-stone-600 font-medium mb-2">Available Evidence:</div>
            <div className="space-y-2">
              {evidence.map(e => (
                <EvidenceItem key={e.id} evidence={e} />
              ))}
            </div>
          </div>
        )}

        <div className="prose prose-stone prose-sm">
          <div className="text-stone-800 font-medium mb-4">
            {action.action?.text || action.text}
          </div>

          <div className="space-y-3">
            {action.action?.actionOptions?.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onSolve();
                  onChapterProgress({
                    type: action.type,
                    text: action.action?.text || action.text,
                    chosenAction: option
                  });
                }}
                className="w-full px-4 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                         transition-colors duration-200 font-medium tracking-wide text-center"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Get challenge type specific UI elements
  const getChallengeTypeUI = () => {
    switch (action.type) {
      case 'RIDDLE':
        return (
          <div className="mb-4 p-4 bg-amber-50 rounded-lg">
            <div className="text-amber-800 font-medium">🔍 Riddle Challenge</div>
            <div className="text-amber-700 mt-1 text-sm">Decode the hidden message...</div>
          </div>
        );
      case 'PUZZLE':
        return (
          <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
            <div className="text-indigo-800 font-medium">🧩 Puzzle Challenge</div>
            <div className="text-indigo-700 mt-1 text-sm">Solve the intricate puzzle...</div>
          </div>
        );
      case 'MEDICAL':
        return (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <div className="text-red-800 font-medium">⚕️ Medical Challenge</div>
            <div className="text-red-700 mt-1 text-sm">Analyze the medical evidence...</div>
          </div>
        );
      case 'OBSERVATION':
        return (
          <div className="mb-4 p-4 bg-emerald-50 rounded-lg">
            <div className="text-emerald-800 font-medium">👁️ Observation Challenge</div>
            <div className="text-emerald-700 mt-1 text-sm">Notice the crucial details...</div>
          </div>
        );
      case 'LOGIC':
        return (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-800 font-medium">🧠 Logic Challenge</div>
            <div className="text-blue-700 mt-1 text-sm">Connect the logical pieces...</div>
          </div>
        );
      case 'PHYSICAL':
        return (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <div className="text-purple-800 font-medium">💪 Physical Challenge</div>
            <div className="text-purple-700 mt-1 text-sm">Examine the physical evidence...</div>
          </div>
        );
      default:
        return null;
    }
  };

  // Challenge card for all other types
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-sm border-2 border-stone-100"
    >
      {getChallengeTypeUI()}

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-stone-900">{action.text}</h3>
        <DifficultyBadge difficulty={action.challenge?.difficulty || 'EASY'} />
      </div>

      {evidence && evidence.length > 0 && (
        <div className="mb-6">
          <div className="text-stone-600 font-medium mb-2">Based on the following evidence:</div>
          <div className="space-y-2">
            {evidence.map(e => (
              <EvidenceItem key={e.id} evidence={e} />
            ))}
          </div>
        </div>
      )}

      <div className="prose prose-stone prose-sm">
        <div className="text-stone-800 font-medium mb-4">
          {action.challenge?.question || action.text}
        </div>

        {showHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-stone-50 rounded-lg"
          >
            <div className="text-stone-600 font-medium mb-2">Hints:</div>
            <ul className="list-disc pl-4 space-y-1">
              {action.challenge?.hints?.map((hint, index) => (
                <li key={index} className="text-stone-600">{hint}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="mt-6 space-y-4">
          <textarea
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            placeholder="Enter your solution..."
            className="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-stone-400 
                     focus:ring-0 transition-colors duration-200"
            rows={3}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowHints(!showHints)}
              className="text-stone-600 hover:text-stone-800 transition-colors duration-200"
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>

            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                       transition-colors duration-200"
            >
              Submit Solution
            </button>
          </div>
        </div>

        {isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg"
          >
            <div className="font-medium">Correct!</div>
            <div className="text-sm mt-1">
              Reward: {action.reward?.description || ''}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function StoryDevelopment() {
  const { 
    setPhase,
    addDialogue,
    addEvidence,
    setAvailableActions,
    dialogueHistory,
    evidence,
  } = useGameStore()
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0)
  const [isAllComplete, setIsAllComplete] = useState(false)
  const [availableActions, setLocalAvailableActions] = useState<Action[]>([])
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const storyEndRef = useRef<HTMLDivElement>(null)
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse()
  const typingSpeed = 40

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatItems, activeItemIndex])

  const handleActionSolved = async (actionId: string) => {
    const action = availableActions.find(a => a.id === actionId);
    if (!action) return;

    // Add any evidence from the action
    if (action.reward?.evidence) {
      addEvidence(action.reward.evidence);
    }

    // Add any dialogue from the action
    if (action.reward?.dialogue) {
      addDialogue(action.reward.dialogue);
    }

    // Remove the solved action from available actions
    const updatedActions = availableActions.filter(a => a.id !== actionId);
    setLocalAvailableActions(updatedActions);
    setAvailableActions(updatedActions);
    };

  useEffect(() => {
    setIsLoading(true);
    startStreaming('STORY_DEVELOPMENT', {
      phase: 'STORY_DEVELOPMENT',
      chapter: currentChapter,
      currentLocation: '221B Baker Street',
      recentDialogue: dialogueHistory,
      evidence,
    }).then(() => {
      setIsLoading(false);
    });

    return () => {
      stopStreaming();
    };
  }, []);

  
  // Update streaming response handling
  useEffect(() => {
    if (streamingState.fullResponse) {     
      console.log('Received streaming response:', streamingState.fullResponse); 
      // Create array to hold new chat items for the current chapter
      const newChatItems: ChatItem[] = [];
      
      // Add chapter title if it exists and hasn't been added for current chapter
      if (streamingState.fullResponse.chapterTitle && 
          !chatItems.some(item => 
            item.type === 'chapter-title' && 
            item.chapterNumber === currentChapter
          )) {
        newChatItems.push({
          id: `chapter-${currentChapter}-title`,
          type: 'chapter-title',
          text: `Chapter ${currentChapter}: ${streamingState.fullResponse.chapterTitle}`,
          currentText: `Chapter ${currentChapter}: ${streamingState.fullResponse.chapterTitle}`,
          isComplete: true,
          chapterNumber: currentChapter
        });
      }

      // Add narrative for current chapter - only if it doesn't exist yet
      const narrativeExists = chatItems.some(item => 
        item.type === 'narrative' && 
        item.chapterNumber === currentChapter
      );

      if (streamingState.narrative && !narrativeExists) {
        newChatItems.push({
          id: `narrative-${currentChapter}`,
          type: 'narrative',
          text: streamingState.narrative,
          currentText: '',  // Start empty for typing animation
          isComplete: false,
          chapterNumber: currentChapter
        });
      }

      // Update existing narrative text if it exists
      if (streamingState.narrative && narrativeExists) {
        setChatItems(prev => prev.map(item => {
          if (item.type === 'narrative' && item.chapterNumber === currentChapter) {
            return {
              ...item,
              text: streamingState.narrative
            };
          }
          return item;
        }));
      }

      // Handle dialogue entries for current chapter - skip narrative entries
      streamingState.fullResponse.dialogueEntries?.forEach(entry => {
        if (entry.speaker === 'NARRATOR') return; // Skip narrator entries as they're handled above
        
        const dialogueId = `dialogue-${currentChapter}-${entry.text}`;
        if (!chatItems.some(item => item.id === dialogueId)) {
          newChatItems.push({
            id: dialogueId,
            type: 'dialogue',
            text: entry.text,
            currentText: entry.text,
            speaker: entry.speaker,
            isComplete: true,
            chapterNumber: currentChapter
          });
          addDialogue({
            text: entry.text,
            speaker: entry.speaker || '',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle deductions for current chapter
      streamingState.fullResponse.deductions?.forEach(deduction => {
        const deductionId = `deduction-${currentChapter}-${deduction.conclusion}`;
        if (!chatItems.some(item => item.id === deductionId)) {
          const deductionText = `${deduction.conclusion}\n\nBased on: ${deduction.observation}`;
          newChatItems.push({
            id: deductionId,
            type: 'deduction',
            text: deductionText,
            currentText: deductionText,
            isComplete: true,
            chapterNumber: currentChapter
          });
        }
      });

      // Handle evidence for current chapter
      streamingState.fullResponse.evidence?.forEach(evidenceItem => {
        const evidenceId = `evidence-${currentChapter}-${evidenceItem.id}`;
        if (!chatItems.some(item => item.id === evidenceId)) {
          newChatItems.push({
            id: evidenceId,
            type: 'evidence',
            text: `New Evidence Discovered: ${evidenceItem.title}`,
            currentText: `New Evidence Discovered: ${evidenceItem.title}`,
            isComplete: true,
            evidence: evidenceItem,
            chapterNumber: currentChapter
          });
          addEvidence(evidenceItem);
        }
      });

      // Only update state if there are new items
      if (newChatItems.length > 0) {
        setChatItems(prev => {
          let updatedItems = [...prev];
          
          // Handle chapter title separately - it always goes at index 0
          const titleItem = newChatItems.find(item => item.type === 'chapter-title');
          const otherItems = newChatItems.filter(item => item.type !== 'chapter-title');
          
          if (titleItem) {
            if (prev.length === 0) {
              updatedItems = [titleItem];
            } else {
              // Insert title at beginning
              updatedItems.unshift(titleItem);
            }
          }
          
          // Find where the current chapter's content starts
          const chapterStart = updatedItems.findIndex(
            item => item.chapterNumber === currentChapter && item.type !== 'chapter-title'
          );
          
          if (chapterStart === -1) {
            // Append other items at the end
            updatedItems = [...updatedItems, ...otherItems];
          } else {
            // Insert other items after the chapter's existing content
            updatedItems.splice(chapterStart, 0, ...otherItems);
          }
          
          return updatedItems;
        });
      }

      // Update available actions
      if (streamingState.fullResponse.availableActions) {
        setLocalAvailableActions(streamingState.fullResponse.availableActions);
        setAvailableActions(streamingState.fullResponse.availableActions);
      }
    }
  }, [streamingState.fullResponse, currentChapter]);

  // Handle streaming text animation
  useEffect(() => {
    if (chatItems.length === 0 || activeItemIndex >= chatItems.length) return;

    const currentItem = chatItems[activeItemIndex];
    if (currentItem.isComplete) {
      if (activeItemIndex < chatItems.length - 1) {
        setActiveItemIndex(prev => prev + 1);
      }
      return;
    }

    const fullText = currentItem.text;
    const currentText = currentItem.currentText || '';

    if (currentText.length < fullText.length) {
      const timeoutId = setTimeout(() => {
        setChatItems(prev => prev.map((item, index) => 
          index === activeItemIndex
            ? { 
                ...item, 
                currentText: fullText.slice(0, currentText.length + 1)
              }
            : item
        ));
      }, typingSpeed);

      return () => clearTimeout(timeoutId);
    } else {
      setChatItems(prev => prev.map((item, index) => 
        index === activeItemIndex ? { ...item, isComplete: true } : item
      ));
    }
  }, [chatItems, activeItemIndex]);

  // Check if all items are complete
  useEffect(() => {
    if (chatItems.length > 0 && chatItems.every(item => item.isComplete)) {
      setIsAllComplete(true);
      // Add small delay before showing actions
      const timer = setTimeout(() => {
        setLocalAvailableActions(availableActions);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [chatItems]);

  // Helper function to determine the correct insert position for new items
  const getInsertIndex = (items: ChatItem[], type: string): number => {
    const orderPriority: { [key: string]: number } = {
      'chapter-title': 0,
      'narrative': 1,
      'dialogue': 2,
      'deduction': 3,
      'evidence': 4
    };

    const newItemPriority = orderPriority[type] || 999;
    
    for (let i = items.length - 1; i >= 0; i--) {
      const currentPriority = orderPriority[items[i].type] || 999;
      if (currentPriority <= newItemPriority) {
        return i + 1;
      }
    }
    return 0;
  };

  const handleChapterProgression = async () => {
    if (currentChapter >= 6) {
      setPhase('CASE_CONCLUSION');
      return;
    }

    const nextChapter = currentChapter + 1;
    setCurrentChapter(nextChapter);
    
    // Start streaming next chapter content while keeping previous chapters
    await startStreaming('STORY_DEVELOPMENT', {
      phase: 'STORY_DEVELOPMENT',
      chapter: nextChapter,
      currentLocation: '221B Baker Street',
      recentDialogue: dialogueHistory,
      evidence,
    });
  };

  const handleAction = async (action: Action) => {
    // If action requires evidence, mark it as used
    if (action.requiresEvidence) {
      action.requiresEvidence.forEach(evidenceId => {
        // useEvidence(evidenceId, action.id);
      });
    }

    // Add Watson's action to dialogue
    addDialogue({
      text: action.text,
      speaker: "Dr. Watson",
      timestamp: new Date().toISOString()
    });

    // Start new streaming response with the selected action
    startStreaming('STORY_DEVELOPMENT', {
      phase: 'STORY_DEVELOPMENT',
      currentLocation: '221B Baker Street',
      selectedAction: action,
      recentDialogue: dialogueHistory,
      evidence: evidence,
    });
  };

  const handleActionSelected = async (actionId: string) => {
    const context: any = {
      phase: 'STORY_DEVELOPMENT',
      selectedAction: actionId,
      evidence: evidence,
      recentDialogue: dialogueHistory.slice(-3),
      recentDeductions: [],
    };
    
    await startStreaming('STORY_DEVELOPMENT', context);
    
    if (streamingState.fullResponse?.selectedAction) {
      const { unlockedEvidence, unlockedDeductions } = streamingState.fullResponse.selectedAction;
      unlockedEvidence?.forEach(evidence => addEvidence(evidence));
      unlockedDeductions?.forEach(deduction => {
        // addDeduction(deduction);
      });
    }
  };

  const handleChallengeSolved = async (solution: string) => {
    const context: any = {
      phase: 'STORY_DEVELOPMENT',
      selectedSolution: solution,
      evidence: evidence,
      recentDialogue: dialogueHistory.slice(-3),
      recentDeductions: [],
    };
    
    await startStreaming('STORY_DEVELOPMENT', context);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-50 px-4 py-8 md:py-12"
    >
      {isLoading ? (
        <div className="max-w-3xl mx-auto">
          <Loading />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="space-y-0">
            {/* Group items by chapter and render them */}
            {Array.from(new Set(chatItems.map(item => item.chapterNumber)))
              .sort((a, b) => (a || 0) - (b || 0))
              .map(chapterNum => (
                <div key={`chapter-${chapterNum}`} className="mb-16">
                  {chatItems
                    .filter(item => item.chapterNumber === chapterNum)
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3"
                      >
                        <StoryBlock
                          type={item.type}
                          text={item.currentText}
                          speaker={item.speaker}
                          isTyping={!item.isComplete}
                          evidence={item.evidence}
                        />

                        {item.type === 'evidence' && item.evidence && (
                          <div className="mt-2 mb-8">
                            <EvidenceDisplay evidence={item.evidence} />
                          </div>
                        )}
                      </motion.div>
                    ))}

                  {/* Show challenge cards for current chapter only */}
                  {chapterNum === currentChapter && availableActions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-16"
                    >
                      <div className="text-lg font-medium text-stone-800 mb-6 flex items-center">
                        <span className="mr-2">Watson can you solve this challenge?</span>
                        <div className="flex-grow h-px bg-stone-200" />
                      </div>
                      {availableActions.map(action => (
                        <ChallengeCard
                          key={action.id}
                          action={action}
                          onSolve={() => handleActionSolved(action.id)}
                          evidence={evidence}
                          onChapterProgress={handleChapterProgression}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
          </div>
          <div ref={storyEndRef} />
        </div>
      )}
    </motion.div>
  );
}
