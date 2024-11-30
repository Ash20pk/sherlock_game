import { Canvas } from '@react-three/fiber'
import { Environment, useGLTF, OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameState'

const VictorianFog = () => {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="#202020"
        transparent
        opacity={0.5}
        fog={true}
      />
    </mesh>
  )
}

export const TitleScreen = () => {
  const { setPhase } = useGameStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-12 w-full h-screen bg-slate-900"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <fog attach="fog" args={['#202020', 5, 15]} />
        <VictorianFog />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      <div className="text-center z-10">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-4xl sm:text-6xl font-bold text-stone-800 mb-4 font-serif"
        >
          Sherlock Holmes
        </motion.h1>
        <motion.h2
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="text-xl sm:text-2xl text-stone-600 font-serif"
        >
          The Case of the Berkeley Square Mystery
        </motion.h2>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-lg text-center space-y-4 text-stone-600 z-10"
      >
        <p className="text-lg">
          Step into the fog-laden streets of Victorian London and join the world's
          greatest detective in solving a most peculiar case.
        </p>
        <p>
          Use your powers of observation and deduction to uncover the truth behind
          a mysterious death in Berkeley Square.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setPhase('NARRATOR_INTRODUCTION')}
        className="px-8 py-4 bg-stone-800 text-stone-100 rounded-lg
                 hover:bg-stone-700 transition-colors duration-200
                 font-serif text-lg tracking-wide z-10"
      >
        Begin the Investigation
      </motion.button>
    </motion.div>
  )
}
