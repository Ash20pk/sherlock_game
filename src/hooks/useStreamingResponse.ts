import { useState, useCallback, useRef } from 'react';
import { NarrativeResponse } from '@/utils/narrative';

interface StreamingState {
  narrative: string;
  isComplete: boolean;
  fullResponse?: NarrativeResponse;
  partialResponse?: Partial<NarrativeResponse>;
  error?: string;
}

export function useStreamingResponse() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    narrative: '',
    isComplete: false
  });
  
  // Use refs to track active streaming state
  const activeStreamRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>('');

  const startStreaming = useCallback(async (phase: string, context?: any) => {
    try {
      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state and set up new stream
      activeStreamRef.current = true;
      abortControllerRef.current = new AbortController();
      bufferRef.current = '';

      setStreamingState({
        narrative: '',
        isComplete: false
      });

      const response = await fetch('/api/narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phase, context }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();

      while (activeStreamRef.current) {
        const { done, value } = await reader.read();
        
        if (done) {
          try {
            const fullResponse = JSON.parse(bufferRef.current);
            if (activeStreamRef.current) {
              setStreamingState(prev => ({
                ...prev,
                narrative: fullResponse.narrative || prev.narrative,
                isComplete: true,
                fullResponse
              }));
            }
          } catch (e) {
            console.error('Error parsing final JSON:', e);
          }
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        bufferRef.current += chunk;

        try {
          // Try to parse as complete JSON first
          const fullResponse = JSON.parse(bufferRef.current);
          if (activeStreamRef.current) {
            setStreamingState(prev => ({
              ...prev,
              narrative: fullResponse.narrative,
              fullResponse
            }));
          }
        } catch (e) {
          // If not valid JSON yet, try to extract the narrative text
          const narrativeMatch = bufferRef.current.match(/"narrative"\s*:\s*"([^"]*)"/);
          if (narrativeMatch && activeStreamRef.current) {
            setStreamingState(prev => ({
              ...prev,
              narrative: narrativeMatch[1]
            }));
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Streaming error:', error);
      if (activeStreamRef.current) {
        setStreamingState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          isComplete: true
        }));
      }
    }
  }, []); // No dependencies needed as we use refs

  const stopStreaming = useCallback(() => {
    activeStreamRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopStreaming();
    setStreamingState({
      narrative: '',
      isComplete: false
    });
  }, [stopStreaming]);

  return {
    streamingState,
    startStreaming,
    stopStreaming,
    reset
  };
}
