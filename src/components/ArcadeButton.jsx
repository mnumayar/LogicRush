import { motion } from 'framer-motion'

/**
 * Drop-in replacement for .btn-arcade divs.
 * Adds spring press + brightness hover via Framer Motion.
 * All existing className / style props pass through unchanged.
 */
export default function ArcadeButton({
  children,
  onClick,
  style,
  className = '',
  type = 'button',
  disabled = false,
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-arcade ${className}`}
      style={style}
      whileHover={{ filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.93, y: 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      {children}
    </motion.button>
  )
}
