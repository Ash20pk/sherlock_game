import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'
import { Action, Evidence, DeductionEntry } from '@/store/gameState'
import EvidenceReport  from './EvidenceReport'
import { Loading } from './Loading'

interface ChatItem {
  id: string;
  type: 'narrative' | 'dialogue' | 'deduction' | 'evidence' | 'chapter-title' | 'action';
  text: string;
  currentText: string;
  speaker?: string;
  isComplete: boolean;
  evidence?: Evidence;
  deduction?: DeductionEntry;
  action?: Action;
  onSolve?: (actionId: string) => void;
  onChapterProgress?: () => void;
  chapterNumber?: number;
}

const EvidenceDisplay: React.FC<{ evidence: Evidence }> = ({ evidence }) => {
  console.log('Rendering evidence:', evidence);
  
  // Get the content from various possible fields
  const content = evidence.content || evidence.details?.text || evidence.description || '';
  console.log('Evidence content:', content);

  return (
    <div className="rounded-lg">
      <div className="text-sm text-amber-600 mb-2">Evidence</div>
      <div className="text-stone-700 mt-1 italic">
        {typeof content === 'object' && 'text' in content ? content.text : content}
      </div>
    </div>
  );
};

const DeductionDisplay: React.FC<{ deduction: DeductionEntry }> = ({ deduction }) => {

  console.log('Rendering deduction:', deduction);
  return (
    <div>
      <div className="text-sm text-amber-600 mb-2">Deductions</div>
      <div className="text-stone-700 italic">
        "{deduction.description}"
      </div>
    </div>
  );
};

const StoryBlock = ({ 
  type,
  text,
  currentText,
  speaker,
  isTyping,
  evidence,
  deduction,
  action,
  onSolve,
  onChapterProgress
}: {
  type: string;
  text: string;
  currentText: string;
  speaker?: string;
  isTyping: boolean;
  evidence?: Evidence;
  deduction?: DeductionEntry;
  action?: Action;
  onSolve?: (actionId: string) => void;
  onChapterProgress?: () => void;
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
      case 'action':
        return 'text-stone-800';
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
      case 'evidence':
        return 'mb-6 bg-amber-50 border-2 border-amber-200 rounded-lg p-4';
      case 'dialogue':
        return 'mb-6';
      case 'action':
        return 'mb-6';
      default:
        return 'mb-3';
    }
  };

  console.log('Rendering StoryBlock:', { type, text, speaker, isTyping, evidence, deduction, action });

  const renderContent = () => {
    switch (type) {
      case 'dialogue':
        return (
          <>
            {speaker && (
              <div className="text-stone-600 mb-1 tracking-wide font-medium">
                {speaker}:
              </div>
            )}
            <div className={`${getTextStyle()} leading-relaxed text-lg`}>
              <span className="font-serif">"</span>
              {text}
              {!isTyping && (
                <span className="inline-block w-1 h-4 ml-1 bg-stone-400 animate-pulse" />
              )}
              {isTyping && <span className="font-serif">"</span>}
            </div>
          </>
        );

      case 'evidence':
        if (evidence) {
          return <EvidenceDisplay evidence={evidence} />;
        }
        break;

      case 'deduction':
        if (deduction) {
          return <DeductionDisplay deduction={deduction} />;
        }
        break;

      case 'action':
        if (action && onSolve && onChapterProgress) {
          return (
            <ChallengeCard 
              action={action}
              onSolve={onSolve}
              onChapterProgress={onChapterProgress}
            />
          );
        }
        break;

      default:
        return (
          <div className={`${getTextStyle()} leading-relaxed text-lg`}>
            {currentText}
            {isTyping && (
              <span className="inline-block w-1 h-4 ml-1 bg-stone-400 animate-pulse" />
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={getBlockStyle()}
    >
      {renderContent()}
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
      type?: string;
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
                    metadata={{
                      ...evidenceDetails.metadata!,
                      type: evidence.type
                    }}
                    description={evidenceDetails.description || ''}
                    content={evidenceDetails.content || ''}
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

  console.log('Action:', action);

  // Handle ACTION type differently
  if (action.type === 'ACTION') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-sm border-2 border-stone-100"
      >
        <div className="text-stone-600 font-medium mb-2">Available Actions:</div>
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
    evidence: existingEvidence,
  } = useGameStore()
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0)
  const [isAllComplete, setIsAllComplete] = useState(false)
  const [availableActions, setLocalAvailableActions] = useState<Action[]>([])
  const [currentChapter, setCurrentChapter] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [processedEvidenceIds, setProcessedEvidenceIds] = useState(new Set<string>())
  const [processedDeductionIds, setProcessedDeductionIds] = useState(new Set<string>())
  const [processedSections, setProcessedSections] = useState(new Set<string>())
  const storyEndRef = useRef<HTMLDivElement>(null)
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse()
  const typingSpeed = 40

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatItems, activeItemIndex])

  const handleActionSolved = async (actionId: string) => {
    const action = availableActions.find(a => a.id === actionId);
    console.log('handleActionSolved', actionId, action)
    if (!action) return;

    // If the action has a reward of type EVIDENCE, generate evidence content
    if (action.reward?.type === 'EVIDENCE') {
      try {
        // Get the solution from the action marker
        const actionSolution = typeof action.solution === 'string' ? action.solution : 
                             Array.isArray(action.solution) ? action.solution.join('\n') : 
                             action.challenge?.solution || '';

        console.log('Generating evidence with params:', {
          type: action.type,
          title: action.reward.description,
          content: actionSolution,
          solution: actionSolution
        });

        const params = new URLSearchParams({
          type: action.type || 'PUZZLE',
          title: action.reward.description || action.text,
          content: actionSolution,
          solution: actionSolution
        });

        const evidenceResponse = await fetch(`/api/evidence/${actionId}?${params}`);

        if (evidenceResponse.ok) {
          const evidenceData = await evidenceResponse.json();
          console.log('Evidence response:', evidenceData);
          
          // Create the evidence object with the generated content
          const evidence = {
            id: `${actionId}_evidence`,
            title: action.reward.description || action.text,
            type: action.type || 'PUZZLE',
            content: evidenceData.content,
            description: evidenceData.description,
            metadata: evidenceData.metadata,
            contentType: evidenceData['content-type'],
            discoveredAt: new Date().toISOString(),
            usedIn: [],
            availableActions: []
          };

          // Add the evidence to the game store
          addEvidence(evidence);

          // Add to chat items
          setChatItems(prev => [
            ...prev,
            {
              id: `evidence-${evidence.id}-${Date.now()}`,
              type: 'evidence',
              text: evidence.content,
              currentText: evidence.content,
              evidence: evidence,
              isComplete: true,
              chapterNumber: currentChapter
            }
          ]);
        }
      } catch (error) {
        console.error('Error generating evidence:', error);
      }
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
      evidence: existingEvidence,
    }).then(() => {
      setIsLoading(false);
    });

    return () => {
      stopStreaming();
    };
  }, []);

  const processStreamingText = (content: string, type: string, currentItems: ChatItem[], currentChapter: number) => {
    if (!content) return currentItems;
  
    let marker = '';
    let start = 0;
    let end = content.length;
  
    switch(type) {
      case 'chapter-title':
        marker = '###CHAPTER###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      case 'narrative':
        marker = '###NARRATIVE###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      case 'dialogue':
        marker = '###DIALOGUE###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      case 'deductions':
        marker = '###DEDUCTIONS###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      case 'evidence':
        marker = '###EVIDENCE###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      case 'action':
        marker = '###ACTION###';
        start = content.indexOf(marker);
        end = content.indexOf('###', start + marker.length);
        break;
      default:
        return currentItems;
    }
  
    if (start === -1) return currentItems;
    if (end === -1) end = content.length;
  
    const text = content.slice(start + marker.length, end).trim();
  
    // For dialogue, we need to process multiple speaker/text pairs
    if (type === 'chapter-title') {
      // For chapter titles, we want to ensure we have the complete title
      const existingIndex = currentItems.findIndex(
        item => item.type === type && item.chapterNumber === currentChapter
      );

      if (existingIndex === -1) {
        // Add new chapter title item
        return [
          {
            id: `chapter-${currentChapter}-${Date.now()}`,
            type: 'chapter-title',
            text: text,
            currentText: text,
            isComplete: true,
            chapterNumber: currentChapter
          },
          ...currentItems
        ];
      } else {
        // Update existing chapter title
        return currentItems.map((item, index) => 
          index === existingIndex
            ? { ...item, text: text, currentText: text, isComplete: true }
            : item
        );
      }
    } else {
      // For narrative 
      const existingIndex = currentItems.findIndex(
        item => item.type === type && item.chapterNumber === currentChapter
      );

      if (existingIndex === -1) {
        // Add new item at the correct position
        const insertIndex = getInsertIndex(currentItems, type);
        const newItem = {
          id: `${type}-${currentChapter}-${Date.now()}`,
          type: type as any,
          text,
          currentText: text,
          isComplete: false,
          chapterNumber: currentChapter
        };
        return [
          ...currentItems.slice(0, insertIndex),
          newItem,
          ...currentItems.slice(insertIndex)
        ];
      } else {
        // Update existing item
        return currentItems.map((item, index) => 
          index === existingIndex
            ? { 
                ...item, 
                text,
                currentText: text
              }
            : item
        );
      }
    }
  };

  // Update the dialogue processing useEffect
  useEffect(() => {
    if (!streamingState.content) return;

    const content = streamingState.content;
  
   // Inside the useEffect that processes streamingState.content
    if (content.includes('###DIALOGUE###')) {
      const dialogueMatch = content.match(/###DIALOGUE###([\s\S]*?)(?=###|$)/);
      if (dialogueMatch && dialogueMatch[1]) {
        const dialogueContent = dialogueMatch[1].trim();
        const dialoguePairs = dialogueContent.split('##SPEAKER##').filter(pair => pair.trim());
        
        dialoguePairs.forEach(pair => {
          const [speaker, text] = pair.split('##TEXT##').map(part => part.trim());
          if (speaker && text) {
            setChatItems(prev => {
              // Find the last dialogue item from this speaker
              const lastIndex = [...prev].reverse().findIndex(
                item => item.type === 'dialogue' && item.speaker === speaker
              );
              
              // If we found a previous dialogue from this speaker and it's not complete
              if (lastIndex !== -1 && !prev[prev.length - 1 - lastIndex].isComplete) {
                // Update existing dialogue
                return prev.map((item, index) => {
                  if (index === prev.length - 1 - lastIndex) {
                    return {
                      ...item,
                      text: text,
                      currentText: text,
                      isComplete: text.endsWith('##')
                    };
                  }
                  return item;
                });
              } else {
                // Create new dialogue item
                return [
                  ...prev,
                  {
                    id: `dialogue-${currentChapter}-${Date.now()}`,
                    type: 'dialogue',
                    text: text,
                    currentText: text,
                    speaker: speaker,
                    isComplete: text.endsWith('##'),
                    chapterNumber: currentChapter
                  }
                ];
              }
            });
          }
        });
      }
    }

    // Check for evidence text
    if (content.includes('###EVIDENCE###')) {
      try {
        const evidenceMatch = content.match(/###EVIDENCE###([\s\S]*?)(?=###|$)/);
        if (evidenceMatch && evidenceMatch[1]) {
          const evidenceText = evidenceMatch[1].trim();
          // Only process if we have a complete evidence section
          if (evidenceText.includes(']')) {
            console.log('Found complete evidence section:', evidenceText);
            try {
              const evidenceData = JSON.parse(evidenceText);
              console.log('Parsed evidence data:', evidenceData);
              if (Array.isArray(evidenceData)) {
                evidenceData.forEach(evidence => {
                  console.log('Processing evidence item:', evidence);
                  if (!processedEvidenceIds.has(evidence.id)) {
                    processedEvidenceIds.add(evidence.id);
                    const evidenceContent = evidence.content || evidence.details?.text || evidence.description || '';
                    console.log('Evidence content to display:', evidenceContent);
                    setChatItems(prev => [
                      ...prev,
                      {
                        id: `evidence-${evidence.id}-${Date.now()}`,
                        type: 'evidence',
                        text: evidenceContent,
                        currentText: evidenceContent,
                        isComplete: true,
                        evidence: evidence,
                        chapterNumber: currentChapter
                      }
                    ]);
                  }
                });
              }
            } catch (parseError) {
              console.error('Error parsing evidence JSON:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing evidence:', error);
      }
    }

    // Check for deductions
    if (content.includes('###DEDUCTIONS###')) {
      try {
        const deductionsMatch = content.match(/###DEDUCTIONS###([\s\S]*?)(?=###|$)/);
        if (deductionsMatch && deductionsMatch[1]) {
          const deductionsText = deductionsMatch[1].trim();
          // Only process if we have a complete deductions section
          if (deductionsText.includes(']')) {
            console.log('Found complete deductions section:', deductionsText);
            try {
              const deductionsData = JSON.parse(deductionsText);
              console.log('Parsed deductions data:', deductionsData);
              if (Array.isArray(deductionsData)) {
                deductionsData.forEach(deduction => {
                  console.log('Processing deduction item:', deduction);
                  if (!processedDeductionIds.has(deduction.id)) {
                    processedDeductionIds.add(deduction.id);
                    const deductionContent = deduction.description;
                    console.log('Deduction content to display:', deductionContent);
                    setChatItems(prev => [
                      ...prev,
                      {
                        id: `deduction-${deduction.id}-${Date.now()}`,
                        type: 'deduction',
                        text: deductionContent,
                        currentText: deductionContent,
                        isComplete: true,
                        deduction: deduction,
                        chapterNumber: currentChapter
                      }
                    ]);
                  }
                });
              }
            } catch (parseError) {
              console.error('Error parsing deductions JSON:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing deductions:', error);
      }
    }

    // Check for actions
    if (content.includes('###ACTION###')) {
      setIsLoadingActions(true);
      try {
        const actionMatch = content.match(/###ACTION###([\s\S]*?)(?=###|$)/);
        if (actionMatch && actionMatch[1]) {
          const actionText = actionMatch[1].trim();
          // Only process if we have a complete action section
          if (actionText.includes('}')) {  
            console.log('Found complete action section:', actionText);
            try {
              const action = JSON.parse(actionText);
              console.log('Parsed action data:', action);

              // Store action in state
              setAvailableActions([action]);
              setLocalAvailableActions([action]);

              // Skip if we've already processed this action
              if (!processedSections.has(`action-${action.id}`)) {
                setProcessedSections(prev => new Set(prev).add(`action-${action.id}`));

                // Add action to chat items
                setChatItems(prev => [
                  ...prev,
                  {
                    id: `action-${action.id}-${Date.now()}`,
                    type: 'action',
                    text: action.text || '',
                    currentText: action.text || '',
                    isComplete: true,
                    action: action,
                    onSolve: handleActionSolved,
                    onChapterProgress: () => setCurrentChapter(prev => prev + 1),
                    chapterNumber: currentChapter
                  }
                ]);

                // Load required evidence for the action if needed
                if (action.requiresEvidence && Array.isArray(action.requiresEvidence)) {
                  action.requiresEvidence.forEach(evidenceId => {
                    if (!existingEvidence.some(e => e.id === evidenceId)) {
                      addEvidence({
                        id: evidenceId,
                        title: action.text || 'Loading...',
                        content: action.challenge?.question || 'Loading evidence...',
                        description: '',
                        discoveredAt: new Date().toISOString(),
                        usedIn: [],
                        availableActions: []
                      });
                    }
                  });
                }
              }
            } catch (parseError) {
              console.error('Error parsing action JSON:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing actions:', error);
      } finally {
        setIsLoadingActions(false);
      }
    }

    // Check for other content types
    if (content.includes('###CHAPTER###')) {
      setChatItems(prev => processStreamingText(content, 'chapter-title', prev, currentChapter));
    }

    if (content.includes('###NARRATIVE###')) {
      setChatItems(prev => processStreamingText(content, 'narrative', prev, currentChapter));
    }

    // Set all items to complete when streaming is done
    if (streamingState.isComplete) {
      setChatItems(prev => prev.map(item => ({ ...item, isComplete: true })));
      setIsAllComplete(true);
    }

  }, [streamingState.content, streamingState.isComplete]);

  useEffect(() => {
    const currentItem = chatItems[activeItemIndex];
    if (!currentItem || currentItem.isComplete || currentItem.type !== 'dialogue') return;
  
    let charIndex = 0;
    const targetText = currentItem.text;
    
    const timer = setInterval(() => {
      if (charIndex <= targetText.length) {
        setChatItems(items => 
          items.map((item, index) => 
            index === activeItemIndex
              ? { 
                  ...item, 
                  currentText: targetText.slice(0, charIndex + 1),
                  isComplete: charIndex + 1 >= targetText.length
                }
              : item
          )
        );
        charIndex++;
      } else {
        clearInterval(timer);
        setActiveItemIndex(prev => prev + 1);
      }
    }, typingSpeed);
  
    return () => clearInterval(timer);
  }, [chatItems, activeItemIndex, typingSpeed]);

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

  console.log('Available actions:', availableActions);

  // Helper function to determine the correct insert position for new items
  const getInsertIndex = (items: ChatItem[], type: string): number => {
    const orderPriority: { [key: string]: number } = {
      'chapter-title': 1,
      'narrative': 2,
      'dialogue': 3,
      'deduction': 4,
      'evidence': 5,
      'actions': 6
    };

    const newItemPriority = orderPriority[type] || 999;
    let insertIndex = 0;
    
    // Find the last item of the same type or the first item of a lower priority type
    for (let i = items.length - 1; i >= 0; i--) {
      const currentPriority = orderPriority[items[i].type] || 999;
      
      if (currentPriority === newItemPriority) {
        // Insert after the last item of the same type
        return i + 1;
      }
      
      if (currentPriority < newItemPriority) {
        // Insert after items with lower priority
        return i + 1;
      }
    }
    
    return insertIndex;
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
      evidence: existingEvidence,
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
      evidence: existingEvidence,
    });
  };

  const handleActionSelected = async (actionId: string) => {
    const context: any = {
      phase: 'STORY_DEVELOPMENT',
      selectedAction: actionId,
      evidence: existingEvidence,
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
      evidence: existingEvidence,
      recentDialogue: dialogueHistory.slice(-3),
      recentDeductions: [],
    };
    
    await startStreaming('STORY_DEVELOPMENT', context);
  };

  console.log('Chat items:', chatItems);
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
                  .map((item) => {
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3"
                      >
                        <StoryBlock
                          type={item.type}
                          text={item.text}
                          currentText={item.currentText}
                          speaker={item.speaker}
                          isTyping={!item.isComplete}
                          evidence={item.evidence}
                          deduction={item.deduction}
                          action={item.action}
                          onSolve={item.onSolve}
                          onChapterProgress={item.onChapterProgress}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              ))}
          </div>
          <div ref={storyEndRef} />
        </div>
      )}
      {isLoadingActions && (
        <div className="mt-8 flex items-center justify-center">
          <Loading />
          <span className="ml-2 text-stone-600">Loading available actions...</span>
        </div>
      )}
    </motion.div>
  );
}
