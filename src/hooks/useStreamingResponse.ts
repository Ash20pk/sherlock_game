import { useState, useCallback, useRef, useEffect } from 'react';
import { NarrativeResponse } from '@/utils/narrative';

interface StreamingState {
  content: string;
  isComplete: boolean;
  error?: string;
}

export function useStreamingResponse() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    content: '',
    isComplete: false
  });
  
  const activeStreamRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (phase: string, context?: any) => {
    // Clean up any existing stream
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.warn('Error aborting previous stream:', e);
      }
    }

    try {
      activeStreamRef.current = true;
      abortControllerRef.current = new AbortController();
      
      setStreamingState({
        content: '',
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
      let buffer = '';
  
      while (activeStreamRef.current) {
        let result;
        try {
          result = await reader.read();
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.log('Stream aborted');
            return;
          }
          throw error;
        }
  
        const { done, value } = result;
        
        if (done) {
          try {
            if (activeStreamRef.current) {
              setStreamingState(prev => ({
                ...prev,
                isComplete: true,
              }));
            }
          } catch (e) {
            console.error('Error parsing final JSON:', e);
          }
          break;
        }
  
        const char = decoder.decode(value, { stream: true });
        // Apply the character immediately for smoother streaming
        setStreamingState(prev => ({
          ...prev,
          content: prev.content + char
        }));

        // Small delay for visual effect after section markers
        if (buffer.endsWith('###') && char === '\n') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        buffer = (buffer + char).slice(-3);
      }
    
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }
      console.error('Streaming error:', error);
      setStreamingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isComplete: true
      }));
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (!activeStreamRef.current) return;
    
    activeStreamRef.current = false;
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    } catch (e) {
      console.warn('Error during stream cleanup:', e);
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        activeStreamRef.current = false;
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
    };
  }, []);

  const reset = useCallback(() => {
    stopStreaming();
    setStreamingState({
      content: '',
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