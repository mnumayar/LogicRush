import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 22, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1    },
  exit:    { opacity: 0, y: -14, scale: 0.97 },
}

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  )
}
