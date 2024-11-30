import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'
import { Action, Evidence } from '@/store/gameState'
import EvidenceReport  from './EvidenceReport'

interface ChatItem {
  id: string;
  type: 'narrative' | 'dialogue' | 'deduction' | 'evidence';
  text: string;
  currentText: string;
  speaker?: string;
  isComplete: boolean;
  evidence?: Evidence;
}

interface ActionButtonProps {
  action: Action;
  onClick: () => void;
  disabled?: boolean;
  evidence?: Evidence[];
}

interface Challenge {
  question: string;
  hints: string[];
  solution: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface Reward {
  type: 'EVIDENCE' | 'DEDUCTION' | 'LOCATION';
  description: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick, disabled, evidence }) => {
  const canUseAction = !action.requiresEvidence || 
    (evidence && action.requiresEvidence.every(reqId => 
      evidence.some(e => e.id === reqId)
    ));

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled || !canUseAction}
      className={`w-full p-4 rounded-lg border-2 text-left transition-colors duration-200 ${
        canUseAction
          ? 'border-stone-800 hover:bg-stone-100 text-stone-800'
          : 'border-stone-300 text-stone-400 cursor-not-allowed'
      }`}
    >
      <div className="font-medium">{action.text}</div>
      {action.requiresEvidence && (
        <div className="text-sm mt-1 text-stone-500">
          {canUseAction 
            ? "Required evidence available"
            : "Requires additional evidence"}
        </div>
      )}
    </motion.button>
  );
};

const EvidenceDisplay: React.FC<{ evidence: Evidence }> = ({ evidence }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg border-2 border-stone-200 bg-stone-50"
    >
      <div className="font-medium text-stone-900">{evidence.title}</div>
      <div className="text-stone-600 mt-1">{evidence.description}</div>
      <div className="text-sm text-stone-500 mt-2">Type: {evidence.type}</div>
    </motion.div>
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
        return 'text-stone-800';
      case 'dialogue':
        return 'text-stone-900';
      case 'deduction':
        return 'italic text-stone-800';
      case 'evidence':
        return 'text-stone-800 font-medium';
      default:
        return 'text-stone-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="my-6"
    >
      {type === 'dialogue' && speaker && (
        <div className="text-stone-600 mb-2 tracking-wide">
          {speaker}:
        </div>
      )}
      <div className={`${getTextStyle()} leading-relaxed text-lg`}>
        {type === 'dialogue' ? `"${text}"` : text}
        {isTyping && (
          <span className="inline-block w-1 h-4 ml-1 bg-stone-400 animate-pulse" />
        )}
      </div>
      {type === 'evidence' && evidence && (
        <div className="mt-4">
          <EvidenceDisplay evidence={evidence} />
        </div>
      )}
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
}> = ({ action, onSolve, evidence }) => {
  const [attempt, setAttempt] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (attempt.toLowerCase().trim() === action.challenge.solution.toLowerCase().trim()) {
      setIsCorrect(true);
      onSolve();
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
            {action.challenge.question}
          </div>

          <div className="mt-6">
            <button
              onClick={onSolve}
              className="w-full px-4 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                       transition-colors duration-200 font-medium tracking-wide text-center"
            >
              Take This Action
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Original challenge card for non-ACTION types
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-sm border-2 border-stone-100"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-stone-900">{action.text}</h3>
        <DifficultyBadge difficulty={action.challenge.difficulty} />
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
          {action.challenge.question}
        </div>

        {showHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="text-stone-600 font-medium mb-2">Hints:</div>
            <ul className="list-disc pl-4 space-y-1">
              {action.challenge.hints.map((hint, index) => (
                <li key={index} className="text-stone-600">{hint}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {!isCorrect && (
          <div className="mt-6 space-y-4">
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder="Enter your solution..."
              className="w-full p-3 border-2 border-stone-200 rounded-lg focus:border-stone-800 focus:ring-0 transition-colors"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-stone-600 text-sm hover:text-stone-800"
              >
                {showHints ? 'Hide Hints' : 'Show Hints'}
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                         transition-colors duration-200 font-medium tracking-wide"
              >
                Submit Solution
              </button>
            </div>
          </div>
        )}

        {isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg"
          >
            <div className="font-medium">Correct!</div>
            <div className="text-sm mt-1">
              Reward: {action.reward.description}
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
    addDeduction,
    dialogueHistory,
    availableActions,
    evidence,
    setAvailableActions,
    addEvidence,
    useEvidence
  } = useGameStore();
  
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const storyEndRef = useRef<HTMLDivElement>(null);
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse();
  const typingSpeed = 40;

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems, activeItemIndex]);

  useEffect(() => {
    startStreaming('STORY_DEVELOPMENT', {
      phase: 'STORY_DEVELOPMENT',
      currentLocation: '221B Baker Street',
      recentDialogue: dialogueHistory,
      evidence: evidence,
    });

    return () => {
      stopStreaming();
    };
  }, []);

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

  // Handle narrative updates
  useEffect(() => {
    if (streamingState.narrative && !chatItems.some(item => item.type === 'narrative')) {
      setChatItems(prev => [...prev, {
        id: 'narrative',
        type: 'narrative',
        text: streamingState.narrative,
        currentText: '',
        isComplete: false
      }]);
    }
  }, [streamingState.narrative]);

  // Handle streaming response updates
  useEffect(() => {
    if (streamingState.fullResponse) {
      // Handle dialogue entries
      streamingState.fullResponse.dialogueEntries?.forEach(entry => {
        if (!chatItems.some(item => item.id === `dialogue-${entry.text}`)) {
          setChatItems(prev => [...prev, {
            id: `dialogue-${entry.text}`,
            type: 'dialogue',
            text: entry.text,
            currentText: '',
            speaker: entry.speaker,
            isComplete: false
          }]);
          addDialogue({
            text: entry.text,
            speaker: entry.speaker || '',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle deductions
      streamingState.fullResponse.deductions?.forEach(deduction => {
        if (!chatItems.some(item => item.id === `deduction-${deduction.conclusion}`)) {
          const deductionText = `${deduction.conclusion}\n\nBased on: ${deduction.observation}`;
          setChatItems(prev => [...prev, {
            id: `deduction-${deduction.conclusion}`,
            type: 'deduction',
            text: deductionText,
            currentText: '',
            isComplete: false
          }]);
          addDeduction({
            conclusion: deduction.conclusion,
            observation: deduction.observation,
            timestamp: new Date().toISOString(),
            author: deduction.author || 'HOLMES'
          });
        }
      });

      // Handle evidence
      streamingState.fullResponse.evidence?.forEach(evidenceItem => {
        if (!chatItems.some(item => item.id === `evidence-${evidenceItem.id}`)) {
          setChatItems(prev => [...prev, {
            id: `evidence-${evidenceItem.id}`,
            type: 'evidence',
            text: `New Evidence Discovered: ${evidenceItem.title}`,
            currentText: '',
            isComplete: false,
            evidence: evidenceItem
          }]);
          addEvidence(evidenceItem);
        }
      });

      // Update available actions
      if (streamingState.fullResponse.availableActions) {
        setAvailableActions(streamingState.fullResponse.availableActions);
      }
    }
  }, [streamingState.fullResponse]);

  // Check if all items are complete
  useEffect(() => {
    if (chatItems.length > 0 && chatItems.every(item => item.isComplete)) {
      setIsAllComplete(true);
      // Add small delay before showing actions
      const timer = setTimeout(() => {
        setShowActions(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [chatItems]);

  const handleAction = async (action: Action) => {
    setShowActions(false);
    
    // If action requires evidence, mark it as used
    if (action.requiresEvidence) {
      action.requiresEvidence.forEach(evidenceId => {
        useEvidence(evidenceId, action.id);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-50"
    >
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="prose prose-stone prose-lg max-w-none">
          <div className="text-sm text-stone-500 mb-8">
            {streamingState.fullResponse?.currentLocation || '221B Baker Street'}
          </div>
          
          <div className="space-y-2">
            {chatItems.map((item, index) => (
              <StoryBlock
                key={item.id}
                type={item.type}
                text={index <= activeItemIndex ? item.currentText || '' : ''}
                speaker={item.speaker}
                isTyping={index === activeItemIndex && !item.isComplete}
                evidence={item.evidence}
              />
            ))}
            <div ref={storyEndRef} />
          </div>

          {streamingState.error && (
            <div className="text-red-600 mt-8">
              {streamingState.error}
            </div>
          )}

          {showActions && availableActions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-8"
            >
              <div className="text-center text-lg text-stone-600 mb-6">
                Dr. Watson's Challenges
              </div>
              <div className="grid gap-6">
                {availableActions.map(action => (
                  <ChallengeCard
                    key={action.id}
                    action={action}
                    onSolve={() => handleAction(action)}
                    evidence={evidence}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
