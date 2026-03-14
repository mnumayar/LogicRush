import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ArcadeButton from '../components/ArcadeButton'
import PageTransition from '../components/PageTransition'

export default function GameOver() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const score      = state?.score      ?? 0
  const category   = state?.category   ?? 'math'
  const isPractice = state?.isPractice ?? false
  const [saving, setSaving]             = useState(!!user)
  const [saveError, setSaveError]       = useState(false)
  const [personalBest, setPersonalBest] = useState(null)
  const [showBadge, setShowBadge]       = useState(false)
  const savedRef = useRef(false)

  const scoreMode = isPractice ? 'practice' : 'compete'

  async function submitScore() {
    if (!user) return
    setSaving(true); setSaveError(false)
    try {
      const { data: bestData } = await supabase
        .from('scores').select('score')
        .eq('user_id', user.id).eq('category', category)
        .order('score', { ascending: false }).limit(1)
      const currentBest = bestData?.[0]?.score ?? 0

      // Try inserting with mode column; fall back without it if column doesn't exist yet
      let result = await supabase.from('scores').insert({ user_id: user.id, category, score, mode: scoreMode })
      if (result.error?.code === '42703') {
        result = await supabase.from('scores').insert({ user_id: user.id, category, score })
      }
      if (result.error) throw result.error

      const newBest = score > currentBest
      setPersonalBest(newBest ? score : currentBest)
      if (newBest) setTimeout(() => setShowBadge(true), 700)
    } catch { setSaveError(true) }
    finally { setSaving(false) }
  }

  useEffect(() => {
    if (!savedRef.current) { savedRef.current = true; if (user) submitScore() }
  }, [])

  return (
    <PageTransition>
      <div
        className="relative min-h-screen flex flex-col items-center justify-center px-5 overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #1E0A4E 0%, #6B2FA0 22%, #C23B7A 48%, #FF7043 72%, #FFB74D 100%)' }}
      >
        <div className="cloud cloud-drift-1" style={{ width: 90,  height: 28, top: '6%',  left: '5%' }} />
        <div className="cloud cloud-drift-2" style={{ width: 120, height: 36, top: '13%', right: '4%' }} />

        <div className="absolute bottom-0 left-0 right-0 h-16"
             style={{ background: 'linear-gradient(to bottom, #3D2B7A, #1E0A4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#6B5BA6' }} />
        </div>

        <div className="relative z-10 w-full max-w-xs text-center">
          {/* Main panel — dramatic entrance */}
          <motion.div
            className="game-panel p-6 mb-5"
            style={{ background: '#FFF9E8' }}
            initial={{ scale: 0.65, opacity: 0, y: 50 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.05 }}
          >
            {/* GAME OVER text — its own pop */}
            <motion.p
              className="font-pixel"
              style={{ fontSize: '0.8rem', color: isPractice ? '#73C140' : '#E74C3C', textShadow: '2px 2px 0 rgba(0,0,0,0.12)' }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0  }}
              transition={{ type: 'spring', stiffness: 350, damping: 16, delay: 0.25 }}
            >
              {isPractice ? 'PRACTICE DONE!' : 'GAME OVER'}
            </motion.p>

            {/* Score — fade up */}
            <motion.div
              className="my-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.42, duration: 0.32 }}
            >
              <p className="font-pixel mb-1" style={{ fontSize: '0.45rem', color: '#888' }}>{isPractice ? 'CORRECT ANSWERS' : 'YOUR SCORE'}</p>
              <p
                className="font-pixel score-shadow"
                style={{ fontSize: '3.5rem', color: '#2c3e50', textShadow: '4px 4px 0 rgba(0,0,0,0.15)', lineHeight: 1 }}
              >
                {score}
              </p>
            </motion.div>

            {/* New high score badge */}
            <AnimatePresence>
              {showBadge && (
                <motion.div
                  className="rounded-full px-5 py-2 inline-block mb-2"
                  style={{ background: '#FFF0C0', border: '3px solid #F5A623', boxShadow: '0 4px 0 #C47D0E' }}
                  initial={{ scale: 0,   opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >
                  <p className="font-pixel" style={{ fontSize: '0.5rem', color: '#C47D0E' }}>
                    🏆 NEW HIGH SCORE!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personal best */}
            {user && !saving && !saveError && personalBest !== null && (
              <motion.p
                className="font-bold text-sm mt-2"
                style={{ color: '#888' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >
                Personal Best ({category}):&nbsp;
                <span className="font-extrabold" style={{ color: '#2c3e50' }}>{personalBest}</span>
              </motion.p>
            )}

            {/* Saving */}
            {user && saving && (
              <div className="flex items-center justify-center gap-2 mt-3" style={{ color: '#888' }}>
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                     style={{ borderColor: '#F5A623', borderTopColor: 'transparent' }} />
                <span className="font-bold text-sm">Saving score…</span>
              </div>
            )}

            {/* Save error */}
            {user && saveError && (
              <button onClick={submitScore} className="font-bold text-sm underline mt-2" style={{ color: '#E74C3C' }}>
                Failed to save. Tap to retry.
              </button>
            )}
          </motion.div>

          {/* Guest CTA */}
          {!user && (
            <motion.div
              className="game-panel p-4 mb-4"
              style={{ background: '#EEF8FF', borderColor: '#4EC0CA', boxShadow: '0 5px 0 #2A8A94' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <p className="font-pixel mb-3" style={{ fontSize: '0.45rem', lineHeight: 2, color: '#2c3e50' }}>
                {isPractice
                  ? 'Log in to track your practice scores!'
                  : 'Log in to save your score and compete on the leaderboard!'}
              </p>
              <ArcadeButton
                onClick={() => navigate('/')}
                style={{ background: '#4EC0CA', borderBottomColor: '#2A8A94', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
                className="text-white"
              >
                LOG IN / SIGN UP
              </ArcadeButton>
            </motion.div>
          )}

          {/* Action buttons — always visible */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <ArcadeButton
              onClick={() => navigate(`/quiz/${category}${isPractice ? '?mode=practice' : ''}`, { replace: true })}
              style={{ background: '#F5A623', borderBottomColor: '#C47D0E', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
              className="text-white"
            >
              {isPractice ? '📚 PRACTICE AGAIN' : '▶ PLAY AGAIN'}
            </ArcadeButton>
            <ArcadeButton
              onClick={() => navigate('/play', { replace: true })}
              style={{ background: '#4EC0CA', borderBottomColor: '#2A8A94', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
              className="text-white"
            >
              CHANGE MODE
            </ArcadeButton>
            {user && (
              <motion.button
                onClick={() => navigate(`/leaderboard?cat=${category}&lbMode=${isPractice ? 'practice' : 'compete'}`, { replace: true })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="font-pixel py-2"
                style={{ fontSize: '0.4rem', color: '#FFD166' }}
              >
                {isPractice ? 'View Practice Board →' : 'View Leaderboard →'}
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
