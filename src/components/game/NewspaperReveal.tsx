import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'

const NewspaperArticle = () => {
  const { setPhase } = useGameStore()

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="bg-stone-100 p-8 shadow-xl max-w-4xl w-full mx-auto font-serif"
    >
      <div className="border-2 border-stone-300 p-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">
            THE LONDON GAZETTE
          </h1>
          <div className="text-stone-600">
            <p>LONDON, WEDNESDAY, OCTOBER 15, 1895</p>
            <p>PRICE ONE PENNY</p>
          </div>
        </header>

        <article className="space-y-4">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-6">
            MYSTERIOUS DEATH AT BERKELEY SQUARE
            <br />
            <span className="text-xl">
              Renowned Antiquarian Found Dead in Locked Study
            </span>
          </h2>

          <p className="text-stone-800 leading-relaxed">
            LONDON - The peaceful atmosphere of Berkeley Square was shattered
            yesterday evening when Professor James Worthington, a distinguished
            antiquarian and collector, was discovered dead in his study under
            most mysterious circumstances.
          </p>

          <p className="text-stone-800 leading-relaxed">
            The professor's body was found by his housekeeper, Mrs. Martha
            Hudson, who reported hearing "strange, unearthly sounds" emanating
            from the study shortly before making the grim discovery. Most
            peculiarly, the room was locked from the inside, with no apparent
            means of entry or exit.
          </p>

          <p className="text-stone-800 leading-relaxed">
            Of particular note is the disappearance of a recently acquired
            Egyptian artifact, said to be of "immense historical significance."
            Scotland Yard's Inspector Lestrade has taken charge of the
            investigation, though sources say the renowned consulting detective,
            Mr. Sherlock Holmes, has been summoned to assist.
          </p>
        </article>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => setPhase('HOLMES_OBSERVATION')}
          className="mt-8 px-6 py-3 bg-stone-800 text-stone-100 rounded
                   hover:bg-stone-700 transition-colors duration-200 mx-auto block"
        >
          Hear Holmes's Observations
        </motion.button>
      </div>
    </motion.div>
  )
}

export const NewspaperReveal = () => {
  return (
    <div className="min-h-screen bg-stone-800 flex items-center justify-center p-4">
      <NewspaperArticle />
    </div>
  )
}
