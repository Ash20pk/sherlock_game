import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameState';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';

const StoryBlock = ({ type, text, speaker, isTyping }) => {
  const getTextStyle = () => {
    switch (type) {
      case 'narrative':
        return 'text-stone-800 prose prose-stone';
      case 'dialogue':
        return 'text-stone-900';
      case 'deduction':
        return 'italic text-stone-800 bg-amber-50 p-4 rounded-lg border border-amber-100';
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
        <div className="text-stone-600 mb-2 tracking-wide font-medium">
          {speaker}:
        </div>
      )}
      {type === 'deduction' && (
        <div className="text-amber-800 mb-2 tracking-wide font-medium">
          Deduction:
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

export default function HolmesInitialReaction() {
  const { setPhase, addDialogue, addDeduction, dialogueHistory, setWatsonJoined } = useGameStore();
  const [narration, setNarration] = useState("");
  const [currentSpeaker, setCurrentSpeaker] = useState("");
  const [currentDialogue, setCurrentDialogue] = useState("");
  const [completedDialogues, setCompletedDialogues] = useState([]);
  const [showWatsonChoice, setShowWatsonChoice] = useState(false);
  const storyEndRef = useRef(null);
  const { streamingState, startStreaming, stopStreaming } = useStreamingResponse();

  useEffect(() => {
    startStreaming('HOLMES_INITIAL_REACTION', {
      phase: 'HOLMES_INITIAL_REACTION',
      currentLocation: '221B Baker Street',
      recentDialogue: dialogueHistory,
    });

    return () => stopStreaming();
  }, []);

  const processContent = (content) => {
    if (!content) return null;

    // Check for duplicate markers - if found, stop streaming and show Watson choice
    const narrativeCount = (content.match(/###NARRATIVE###/g) || []).length;
    const dialogueCount = (content.match(/###DIALOGUE###/g) || []).length;
    
    if (narrativeCount > 1 || dialogueCount > 1) {
      console.log('Duplicate markers detected, stopping stream');
      stopStreaming();
      
      // Add all dialogues to history
      completedDialogues.forEach(item => {
        addDialogue({
          character: item.role,
          dialogue: item.line
        });
      });

      setShowWatsonChoice(true);
      return;
    }
    
    // Extract narrative content...
    const narrativeMarker = '###NARRATIVE###';
    if (content.includes(narrativeMarker)) {
      const start = content.indexOf(narrativeMarker) + narrativeMarker.length;
      const nextMarker = content.indexOf('###', start);
      const narrative = nextMarker === -1 ? content.slice(start) : content.slice(start, nextMarker);
      setNarration(narrative.trim());
    }

    // Process dialogue content...
    const dialogueMarker = '###DIALOGUE###';
    if (content.includes(dialogueMarker)) {
      const dialogueStart = content.indexOf(dialogueMarker) + dialogueMarker.length;
      const nextSection = content.indexOf('###', dialogueStart);
      const dialogueContent = nextSection === -1 ? content.slice(dialogueStart) : content.slice(dialogueStart, nextSection);

      if (dialogueContent.includes('##SPEAKER##')) {
        const speakerStart = dialogueContent.lastIndexOf('##SPEAKER##') + '##SPEAKER##'.length;
        const speakerEnd = dialogueContent.indexOf('##TEXT##', speakerStart);
        
        if (speakerEnd !== -1) {
          const speaker = dialogueContent.slice(speakerStart, speakerEnd).trim();
          if (speaker !== currentSpeaker) {
            if (currentSpeaker && currentDialogue) {
              const cleanDialogue = currentDialogue
                .replace(/##SPE.*$/, '')
                .replace(/###DED.*$/, '')
                .replace(/###DIALOGUE###.*$/, '')
                .replace(/^\"|\"$/g, '')
                .replace(/^\"|\"|\"$/g, '')
                .replace(/^\[|\]$/g, '')
                .replace(/##S.*$/, '')
                .trim();

              if (cleanDialogue) {
                console.log('Completing dialogue:', { role: currentSpeaker, line: cleanDialogue });
                setCompletedDialogues(prev => [...prev, { role: currentSpeaker, line: cleanDialogue }]);
              }
              setCurrentDialogue("");
            }
            setCurrentSpeaker(speaker);
          }
          
          const textStart = speakerEnd + '##TEXT##'.length;
          let text;
          
          const nextSpeaker = dialogueContent.indexOf('##SPEAKER##', textStart);
          const deductionsMarker = dialogueContent.indexOf('###DEDUCTIONS###', textStart);
          
          if (nextSpeaker !== -1 && (deductionsMarker === -1 || nextSpeaker < deductionsMarker)) {
            text = dialogueContent.slice(textStart, nextSpeaker);
          } else if (deductionsMarker !== -1) {
            text = dialogueContent.slice(textStart, deductionsMarker);
          } else {
            text = dialogueContent.slice(textStart);
          }
          
          const cleanText = text
            .replace(/^\"|\"$/g, '')
            .replace(/^\"|\"|\"$/g, '')
            .replace(/##SPE.*$/, '')
            .replace(/###DED.*$/, '')
            .replace(/###DIALOGUE###.*$/, '')
            .replace(/^\"|\"$/g, '')
            .replace(/^\"|\"|\"$/g, '')
            .replace(/^\[|\]$/g, '')
            .replace(/##S.*$/, '')
            .trim();
            
          if (cleanText) {
            setCurrentDialogue(cleanText);
          }
        }
      }
    }

    // Process deductions when streaming is complete
    if (streamingState.isComplete && content.includes('###DEDUCTIONS###')) {
      const deductionsMarker = '###DEDUCTIONS###';
      const deductionsStart = content.indexOf(deductionsMarker) + deductionsMarker.length;
      const nextSection = content.indexOf('###', deductionsStart);
      try {
        const deductionsContent = nextSection === -1 
          ? content.slice(deductionsStart).trim() 
          : content.slice(deductionsStart, nextSection).trim();
        if (deductionsContent.startsWith('[') && deductionsContent.endsWith(']')) {
          const deductions = JSON.parse(deductionsContent);
          deductions.forEach(item => {
            addDeduction(item.interpretation || item.deduction);
          });
        }
      } catch (error) {
        console.error('Error parsing deductions:', error);
      }

      // Complete the final dialogue
      if (currentSpeaker && currentDialogue && !completedDialogues.some(d => d.role === currentSpeaker && d.line === currentDialogue.trim())) {
        const cleanDialogue = currentDialogue
          .replace(/##SPE.*$/, '')
          .replace(/###DED.*$/, '')
          .replace(/###DIALOGUE###.*$/, '')
          .replace(/^\"|\"$/g, '')
          .replace(/^\"|\"|\"$/g, '')
          .replace(/^\[|\]$/g, '')
          .replace(/##S.*$/, '')
          .trim();

        if (cleanDialogue) {
          console.log('Completing final dialogue:', { role: currentSpeaker, line: cleanDialogue });
          setCompletedDialogues(prev => [...prev, { role: currentSpeaker, line: cleanDialogue }]);
          setCurrentDialogue("");
          setCurrentSpeaker("");
        }
      }

      // Add all dialogues to history
      completedDialogues.forEach(item => {
        addDialogue({
          character: item.role,
          dialogue: item.line
        });
      });

      // Show Watson choice when streaming is complete
      setShowWatsonChoice(true);
    }
  };

  // Set showWatsonChoice when stream is complete
  useEffect(() => {
    if (streamingState.isComplete) {
      setShowWatsonChoice(true);
    }
  }, [streamingState.isComplete]);

  useEffect(() => {
    if (!streamingState.content) return;
    processContent(streamingState.content);
  }, [streamingState.content, streamingState.isComplete]);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [narration, currentDialogue, completedDialogues]);

  const handleWatsonChoice = (willJoin) => {
    setWatsonJoined(willJoin);
    
    const response = willJoin 
      ? "I would be honored to assist you in this investigation, Holmes. Your deductions are, as always, fascinating."
      : "I must decline this time, Holmes. Though your deductions intrigue me, my medical practice requires my attention.";
    
    addDialogue({
      character: "Dr. Watson",
      dialogue: response
    });

    setTimeout(() => {
      addDialogue({
        character: "Sherlock Holmes",
        dialogue: willJoin 
          ? "Excellent, Watson! Your medical expertise may prove invaluable in this case."
          : "I understand, my dear Watson. I shall keep you informed of any remarkable developments."
      });

      setTimeout(() => setPhase('STORY_DEVELOPMENT'), 2000);
    }, 2000);
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
            221B Baker Street
          </div>
          
          <div className="space-y-2">
            {narration && (
              <StoryBlock
                type="narrative"
                text={narration}
                speaker={null}
                isTyping={!streamingState.isComplete}
              />
            )}
            
            {completedDialogues.map((dialogue, index) => (
              <StoryBlock
                key={index}
                type="dialogue"
                text={dialogue.line}
                speaker={dialogue.role}
                isTyping={false}
              />
            ))}
            
            {currentSpeaker && currentDialogue && (
              <StoryBlock
                type="dialogue"
                text={currentDialogue}
                speaker={currentSpeaker}
                isTyping={!streamingState.isComplete}
              />
            )}
            
            <div ref={storyEndRef} />
          </div>

          {streamingState.error && (
            <div className="text-red-600 mt-8">{streamingState.error}</div>
          )}

          {showWatsonChoice && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-8"
            >
              <div className="text-center text-lg text-stone-600">
                Dr. Watson, will you join Holmes in this investigation?
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleWatsonChoice(true)}
                  className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 
                           transition-colors duration-200 font-medium tracking-wide"
                >
                  Join the Investigation
                </button>
                <button
                  onClick={() => handleWatsonChoice(false)}
                  className="px-6 py-3 border-2 border-stone-800 text-stone-800 rounded-lg 
                           hover:bg-stone-100 transition-colors duration-200 font-medium tracking-wide"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}