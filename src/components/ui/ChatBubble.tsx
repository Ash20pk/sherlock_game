import { motion } from 'framer-motion';
import { TelegramEffect } from './TelegramEffect';

interface ChatBubbleProps {
  type: 'narrative' | 'dialogue' | 'deduction';
  text: string;
  speaker?: string;
  isComplete: boolean;
  onComplete?: () => void;
}

export function ChatBubble({ type, text, speaker, isComplete, onComplete }: ChatBubbleProps) {
  const getBubbleStyle = () => {
    switch (type) {
      case 'narrative':
        return 'bg-stone-100 border-stone-200';
      case 'dialogue':
        return 'bg-amber-50 border-amber-200';
      case 'deduction':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-stone-100 border-stone-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'narrative':
        return '📜';
      case 'dialogue':
        return '💭';
      case 'deduction':
        return '🔍';
      default:
        return '📜';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-2 shadow-md mb-4 overflow-hidden ${getBubbleStyle()}`}
    >
      <div className="p-4">
        {(type === 'dialogue' || type === 'deduction') && (
          <div className="flex items-center gap-2 mb-2 text-stone-600">
            <span className="text-xl">{getIcon()}</span>
            <span className="font-medium">
              {type === 'dialogue' ? speaker : 'Deduction'}
            </span>
          </div>
        )}
        <TelegramEffect
          text={text}
          isComplete={isComplete}
          onComplete={onComplete}
        />
      </div>
    </motion.div>
  );
}
