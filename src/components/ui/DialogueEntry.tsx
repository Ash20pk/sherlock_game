import { motion } from 'framer-motion';
import { DialogueEntry as DialogueEntryType } from '@/store/gameState';

interface DialogueEntryProps {
  entry: DialogueEntryType;
}

export function DialogueEntry({ entry }: DialogueEntryProps) {
  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'HOLMES':
        return 'text-blue-800';
      case 'WATSON':
        return 'text-green-800';
      case 'NARRATOR':
        return 'text-stone-600';
      case 'LESTRADE':
        return 'text-purple-800';
      case 'WITNESS':
        return 'text-amber-800';
      default:
        return 'text-stone-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="flex flex-col space-y-1">
        <span className={`font-serif font-semibold ${getSpeakerColor(entry.speaker)}`}>
          {entry.speaker}
        </span>
        <p className="text-stone-700 font-serif leading-relaxed pl-4 border-l-2 border-stone-200">
          {entry.text}
        </p>
      </div>
    </motion.div>
  );
}
