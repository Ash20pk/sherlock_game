import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameState';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { BookOpen, MapPin, Clock, Feather } from 'lucide-react';

const StoryBlock = ({ type, text, speaker, isTyping }) => {
  const getTextStyle = () => {
    switch (type) {
      case 'narrative':
        return 'text-stone-800 prose prose-stone prose-headings:font-serif prose-p:font-serif';
      case 'dialogue':
        return 'text-stone-900 font-serif';
      case 'deduction':
        return 'italic text-stone-800 bg-gradient-to-br from-amber-50/50 to-stone-50 p-6 rounded-sm border border-amber-800/20 shadow-inner';
      default:
        return 'text-stone-800 font-serif';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-8 relative"
    >
      {type === 'dialogue' && speaker && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 mb-3"
        >
          <Feather className="w-4 h-4 text-amber-800" />
          <span className="text-amber-800 tracking-wide font-medium font-serif">
            {speaker}
          </span>
        </motion.div>
      )}
      {type === 'deduction' && (
        <div className="text-amber-800 mb-3 font-medium font-serif flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>Deduction</span>
        </div>
      )}
      <div className={`${getTextStyle()} leading-relaxed text-lg`}>
        {type === 'dialogue' ? (
          <span className="relative">
            "{text}"
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-900/5 to-transparent opacity-30 pointer-events-none" />
          </span>
        ) : text}
        {isTyping && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-1 h-4 ml-1 bg-amber-800"
          />
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
      className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50"
    >
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Location header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 border-double border-4 border-amber-800/20 -m-4" />
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between p-4 bg-stone-50"
          >
            <div className="flex items-center gap-2 text-amber-800">
              <MapPin className="w-5 h-5" />
              <span className="font-serif tracking-wide">221B Baker Street</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">
                {new Date().toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main content */}
        <div className="relative">
          {/* Decorative corners */}
          <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-amber-800/20" />
          <div className="absolute -top-2 -right-2 w-16 h-16 border-t-2 border-r-2 border-amber-800/20" />
          <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b-2 border-l-2 border-amber-800/20" />
          <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-amber-800/20" />

          <div className="prose prose-stone prose-lg max-w-none p-8 bg-stone-50/80 shadow-xl">
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
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-4 bg-red-50 border border-red-200 rounded-sm text-red-800"
              >
                {streamingState.error}
              </motion.div>
            )}

            {showWatsonChoice && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 space-y-8"
              >
                <div className="text-center text-xl text-stone-800 font-serif">
                  Dr. Watson, will you join Holmes in this investigation?
                </div>
                <div className="flex justify-center gap-6">
                  <button
                    onClick={() => handleWatsonChoice(true)}
                    className="group relative px-8 py-3 bg-stone-800 text-stone-100 rounded-sm
                             transition-all duration-300 hover:bg-stone-700 font-serif tracking-wide"
                  >
                    <span className="absolute inset-0 border border-stone-600 rounded-sm 
                                 transform group-hover:translate-x-1 group-hover:translate-y-1 
                                 transition-transform" />
                    <span className="relative">Join the Investigation</span>
                  </button>
                  <button
                    onClick={() => handleWatsonChoice(false)}
                    className="group relative px-8 py-3 bg-stone-50 text-stone-800 rounded-sm
                             border-2 border-stone-800 hover:bg-stone-100 
                             transition-all duration-300 font-serif tracking-wide"
                  >
                    <span className="absolute inset-0 border border-stone-300 rounded-sm 
                                 transform group-hover:translate-x-1 group-hover:translate-y-1 
                                 transition-transform" />
                    <span className="relative">Decline</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}