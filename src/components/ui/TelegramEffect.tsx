import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Vector3 } from 'three'
import { gsap } from 'gsap'
import { motion, useAnimation } from 'framer-motion';

interface TextLineProps {
  text: string
  position: [number, number, number]
  opacity?: number
}

function TextLine({ text, position, opacity = 1 }: TextLineProps) {
  const textRef = useRef<any>()
  const { viewport } = useThree()

  useEffect(() => {
    if (textRef.current) {
      gsap.from(textRef.current.position, {
        y: position[1] + 1,
        duration: 0.5,
        ease: "power2.out"
      })
      gsap.from(textRef.current.material, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      })
    }
  }, [position])

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={viewport.width * 0.03}
      color="#1a1a1a"
      anchorX="left"
      anchorY="middle"
      material-transparent={true}
      material-opacity={opacity}
      font="/fonts/SpecialElite-Regular.ttf"
      maxWidth={viewport.width * 0.8}
    >
      {text}
    </Text>
  )
}

interface TelegramEffectProps {
  text: string;
  isComplete: boolean;
  onComplete?: () => void;
}

export function TelegramEffect({ text, isComplete, onComplete }: TelegramEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const controls = useAnimation();

  useEffect(() => {
    let currentIndex = 0;
    const textToType = text || '';

    // Reset if text changes completely
    if (!textToType.startsWith(displayedText)) {
      setDisplayedText('');
      currentIndex = 0;
    }

    if (currentIndex < textToType.length) {
      const intervalId = setInterval(() => {
        if (currentIndex < textToType.length) {
          setDisplayedText(textToType.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          onComplete?.();
        }
      }, 30); // Adjust typing speed here

      return () => clearInterval(intervalId);
    } else if (currentIndex === textToType.length) {
      onComplete?.();
    }
  }, [text, onComplete]);

  return (
    <div className="min-h-[100px] bg-amber-50 p-6 rounded-lg border-2 border-amber-200 shadow-lg relative">
      <div className="space-y-4 font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
        {displayedText}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [0, 1] }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: "easeInOut"
            }}
            className="inline-block w-2 h-4 bg-gray-800 ml-1 align-middle"
          />
        )}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-amber-200/50" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-amber-200/50" />
      </div>
    </div>
  );
}
