import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameState';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { Scroll, BookOpen, MapPin, Feather, Hourglass, Eye, Brain, Flask, Lock } from 'lucide-react';
import { Action, Evidence, DeductionEntry } from '@/store/gameState';
import EvidenceReport from './EvidenceReport';
import { Loading } from './Loading';

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
  onChapterProgress,
  existingEvidence,
  chapterNumber 
}) => {
  const getTextStyle = () => {
    switch (type) {
      case 'narrative':
        return 'text-stone-800 prose prose-stone font-serif leading-relaxed';
      case 'dialogue':
        return 'text-stone-900 font-serif';
      case 'deduction':
        return 'text-stone-800 italic font-serif';
      default:
        return 'text-stone-800 font-serif';
    }
  };

  const getBlockStyle = () => {
    switch (type) {
      case 'chapter-title':
        return 'relative my-12 text-center';
      case 'narrative':
        return 'relative my-8 p-6 bg-stone-50 border border-stone-200 rounded-sm shadow-sm';
      case 'deduction':
        return 'relative my-8 p-6 bg-gradient-to-r from-amber-50/50 to-stone-50 border-l-4 border-amber-800/30';
      case 'evidence':
        return 'relative my-8 p-6 bg-gradient-to-br from-stone-50 to-amber-50/30 border border-amber-800/20 rounded-sm';
      case 'dialogue':
        return 'relative my-8';
      case 'action':
        return 'relative my-8';
      default:
        return 'relative my-8';
    }
  };

  console.log('existing evidence:', existingEvidence);
  console.log('existing action evidence:', action);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={getBlockStyle()}
    >
      {type === 'chapter-title' ? (
        <div className="flex flex-col items-center">
          <Scroll className="w-8 h-8 text-amber-800 mb-4" />
          <div className="text-3xl font-serif text-stone-800 tracking-wide">
            Chapter {chapterNumber}: {currentText}
          </div>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-amber-800/30 to-transparent" />
        </div>
      ) : (
        <>
          {type === 'dialogue' && speaker && (
            <div className="flex items-center gap-2 mb-3">
              <Feather className="w-4 h-4 text-amber-800" />
              <span className="text-amber-800 tracking-wide font-medium font-serif">
                {speaker}
              </span>
            </div>
          )}

          {type === 'deduction' && (
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-amber-800" />
              <span className="text-amber-800 tracking-wide font-medium font-serif">
                Deduction
              </span>
            </div>
          )}

          {type === 'action' ? (
            <ChallengeCard 
              action={action}
              evidence={action.requiresEvidence?.map(evidenceId => {
                const foundEvidence = existingEvidence.find(e => e.id.includes(evidenceId));
                console.log('exisiting evidence:', existingEvidence, 'evidenceId:', evidenceId);
                console.log('Found evidence:', foundEvidence);
                return {
                  ...foundEvidence,
                  hint: action.challenge?.hints,
                  description: foundEvidence?.description, 
                  type: action.type,
                  solution: action.challenge?.solution
                };
              })}
              onSolve={onSolve}
              onChapterProgress={onChapterProgress}
            />
          ) : (
            <div className={`${getTextStyle()} relative`}>
              {type === 'dialogue' ? (
                <div className="relative">
                  <span className="font-serif text-2xl text-amber-800/20 absolute -left-4 -top-2">"</span>
                  {currentText}
                  {!isTyping && <span className="font-serif text-2xl text-amber-800/20">"</span>}
                </div>
              ) : currentText}
              
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1 h-4 ml-1 bg-amber-800"
                />
              )}
            </div>
          )}
        </>
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
      type?: string;
    };
    description?: string;
    content?: string;
    hint?: [];
    analysis?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  console.log('Rendering EvidenceItem Key:', evidence);

  const loadEvidenceDetails = useCallback(async () => {
    if (!evidenceDetails.hint && !isLoading && availableActions.length > 0 && !evidenceDetails.metadata) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/evidence/${evidence.id}?` + new URLSearchParams({
            type: evidence.type,
            description: evidence.description,
            hint: evidence.hint || '',
            solution: evidence.solution || ''
          })
        );
        const data = await response.json();
        setEvidenceDetails(prev => ({
          ...prev,
          ...data,
        }));
      } catch (error) {
        console.error('Error loading evidence details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [evidence.id, evidence.type, evidence.description, evidence.hint, evidence.solution, evidenceDetails.hint, evidenceDetails.metadata, isLoading, availableActions]);

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
    if (availableActions.length > 0 && !evidenceDetails.metadata) {
      loadEvidenceDetails();
    }
  }, [availableActions, evidenceDetails.metadata, loadEvidenceDetails]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-left p-3 rounded-lg bg-stone-50 hover:bg-stone-100 
                   border-2 border-stone-200 transition-colors duration-200"
      >
        <div className="font-medium text-stone-900">{evidence.description}</div>
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
    type: 'ACTION' | 'RIDDLE' | 'PUZZLES' | 'MEDICAL' | 'OBSERVATION' | 'LOGIC' | 'PHYSICAL';
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
    if (similarity >= 0.1) {
      setIsCorrect(true);
      onSolve();
      onChapterProgress({
        type: action.type,
        question: action.challenge?.question || action.text,
        solution: attempt
      });
    } else {
      alert("That's not quite right. Try again!");
    }
  };

  // Handle ACTION type differently
  if (action.type === 'ACTIONS' || action.type === 'Actions' || action.type === 'actions' || action.type === 'action' || action.type === 'ACTION') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-sm border-2 border-stone-100"
      >
      <div className="text-stone-800 font-medium mb-4">
            {action.action?.text || action.text}
          </div>        {evidence && evidence.length > 0 && (
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
      case 'PUZZLES':
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
    addDeduction,
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

  const processContent = (content: string, type: string, currentItems: ChatItem[]) => {
    let marker = '';
    let start = -1;
    let end = -1;

    switch (type) {
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
  
    // Skip dialogue processing here since it's handled in the useEffect
    if (type === 'dialogue') {
      return currentItems;
    }

    // For chapter titles, we want to ensure we have the complete title
    if (type === 'chapter-title') {
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
      // For other types
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

  useEffect(() => {
    if (streamingState.isComplete === true) {
      chatItems.forEach(item => {
        if (item.type === 'dialogue') {
          addDialogue({
            text: item.text,
            speaker: item.speaker || '',
            timestamp: new Date().toISOString()
          });
        }
        if (item.type === 'deduction') {
          addDeduction({
            observation: item.text,
            timestamp: new Date().toISOString()
          });
        }
        if (item.type === 'evidence') {
          addEvidence({
            id: item.id,
            description: item.text,
            discoveredAt: new Date().toISOString(),
            usedIn: [],
            availableActions: []
          });
        }
      });
    }
  }, [streamingState.isComplete]);

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
              
              const cleantext = text
                .replace(/##.*$/, '') // Remove ## markers
                .replace(/^\"|\"$/g, '') // Remove outer quotes
                .replace(/^\"|\"|\"$/g, '') // Remove any remaining quotes
                .replace(/^\[|\]$/g, '') // Remove leading and trailing square brackets
                .trim();

              // If we found a previous dialogue from this speaker and it's not complete
              if (lastIndex !== -1 && !prev[prev.length - 1 - lastIndex].isComplete) {

                // Update existing dialogue
                return prev.map((item, index) => {
                  if (index === prev.length - 1 - lastIndex) {
                    return {
                      ...item,
                      text: cleantext,
                      currentText: cleantext,
                      isComplete: cleantext.endsWith('##')
                    };
                  }
                  return item;
                });
              } else {        
                // Create new dialogue item
                return [
                  ...prev,
                  {
                    id: `dialogue-${speaker}-${currentChapter}-${Date.now()}`,
                    type: 'dialogue',
                    text: cleantext,
                    currentText: cleantext,
                    speaker: speaker,
                    isComplete: cleantext.endsWith('##'),
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
            try {
              const evidenceData = JSON.parse(evidenceText);
              if (Array.isArray(evidenceData)) {
                evidenceData.forEach(evidence => {
                  if (!processedEvidenceIds.has(evidence.id)) {
                    processedEvidenceIds.add(evidence.id);
                    const evidenceContent = evidence.content || evidence.details?.text || evidence.description || '';
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
            try {
              const deductionsData = JSON.parse(deductionsText);
              if (Array.isArray(deductionsData)) {
                deductionsData.forEach(deduction => {
                  if (!processedDeductionIds.has(deduction.id)) {
                    processedDeductionIds.add(deduction.id);
                    const deductionContent = deduction.description;
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
            try {
              const action = JSON.parse(actionText);

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
      setChatItems(prev => processContent(content, 'chapter-title', prev));
    }

    if (content.includes('###NARRATIVE###')) {
      setChatItems(prev => processContent(content, 'narrative', prev));
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

    if (currentItem.type === 'dialogue') {
      addDialogue({
        text: targetText || '',
        speaker: currentItem.speaker || '',
        timestamp: new Date().toISOString()
      });
    }
    
    
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

  const handleActionSolved = async (actionId: string) => {
    const action = availableActions.find(a => a.id === actionId);
    if (!action) return;

    // Remove the solved action from available actions
    const updatedActions = availableActions.filter(a => a.id !== actionId);
    setLocalAvailableActions(updatedActions);
    setAvailableActions(updatedActions);
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
                          onSolve={() => handleActionSolved(item.action.id)}
                          onChapterProgress={() => handleChapterProgression()}
                          existingEvidence={existingEvidence}
                          chapterNumber={item.chapterNumber}
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
