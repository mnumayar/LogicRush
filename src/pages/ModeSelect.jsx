import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ArcadeButton from '../components/ArcadeButton'
import PageTransition from '../components/PageTransition'

const MODES = [
  { key: 'math',  label: 'MATH',  emoji: '🧮', color: '#73C140', shadow: '#4A8C1C', bg: '#F0FBE8' },
  { key: 'logic', label: 'LOGIC', emoji: '🧠', color: '#9B59B6', shadow: '#6C3483', bg: '#F5EEF8' },
]

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl text-center py-3 px-2"
         style={{ background: 'rgba(255,255,255,0.7)', border: '2px solid rgba(0,0,0,0.08)' }}>
      <div className="font-bold text-xs mb-1" style={{ color: '#888' }}>{label}</div>
      {value === undefined ? (
        <div className="h-5 rounded mx-auto animate-pulse" style={{ background: '#DDD', width: '60%' }} />
      ) : (
        <div className="font-pixel" style={{ fontSize: '0.7rem', color: '#2c3e50' }}>{value}</div>
      )}
    </div>
  )
}

function ModeCard({ mode, stats, onPlay, onPractice, onLeaderboard, delay }) {
  const bestStreak = (() => {
    if (!stats?.allScores) return 0
    let max = 0, cur = 0
    for (const s of stats.allScores) {
      if (s > 0) { cur++; if (cur > max) max = cur } else cur = 0
    }
    return max
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
      className="rounded-2xl p-5"
      style={{ background: mode.bg, border: `3px solid ${mode.shadow}`, boxShadow: `0 6px 0 ${mode.shadow}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
          style={{ fontSize: '2.2rem', display: 'inline-block' }}
        >
          {mode.emoji}
        </motion.span>
        <h2 className="font-pixel" style={{ fontSize: '0.8rem', color: '#2c3e50' }}>{mode.label}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatTile label="🏆 Best"    value={stats ? (stats.max ?? 0) : undefined} />
        <StatTile label="🎮 Runs"    value={stats ? (stats.count ?? 0) : undefined} />
        <StatTile label="📈 Average" value={stats ? (stats.avg != null ? Number(stats.avg).toFixed(1) : '0.0') : undefined} />
        <StatTile label="🔥 Streak"  value={stats ? bestStreak : undefined} />
      </div>

      <div className="flex gap-2 mb-2">
        <ArcadeButton
          onClick={onPlay}
          style={{ background: mode.color, borderBottomColor: mode.shadow, fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
          className="text-white flex-1"
        >
          ▶ COMPETE
        </ArcadeButton>
        <ArcadeButton
          onClick={onPractice}
          style={{ background: '#F5A623', borderBottomColor: '#C47D0E', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
          className="text-white flex-1"
        >
          📚 PRACTICE
        </ArcadeButton>
      </div>
      <motion.button
        onClick={onLeaderboard}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="w-full font-pixel py-2 text-center"
        style={{ color: mode.shadow, fontSize: '0.38rem', lineHeight: 2 }}
      >
        View Leaderboard →
      </motion.button>
    </motion.div>
  )
}

export default function ModeSelect() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ math: null, logic: null })

  useEffect(() => {
    if (!user) {
      setStats({ math: { count: 0, max: 0, avg: 0, allScores: [] }, logic: { count: 0, max: 0, avg: 0, allScores: [] } })
      return
    }
    async function loadStats() {
      for (const cat of ['math', 'logic']) {
        const { data } = await supabase
          .from('scores').select('score').eq('user_id', user.id).eq('category', cat)
          .order('created_at', { ascending: true })
        if (data) {
          const sv = data.map((r) => r.score)
          const count = sv.length
          const max   = count > 0 ? Math.max(...sv) : 0
          const avg   = count > 0 ? sv.reduce((a, b) => a + b, 0) / count : 0
          setStats((prev) => ({ ...prev, [cat]: { count, max, avg, allScores: sv } }))
        }
      }
    }
    loadStats()
  }, [user])

  function handleLogout() { supabase.auth.signOut() }

  return (
    <PageTransition>
      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #1E0A4E 0%, #6B2FA0 22%, #C23B7A 48%, #FF7043 72%, #FFB74D 100%)' }}
      >
        <div className="cloud cloud-drift-1" style={{ width: 100, height: 32, top: '6%',  left: '4%' }} />
        <div className="cloud cloud-drift-2" style={{ width: 140, height: 42, top: '12%', right: '5%' }} />

        <div className="absolute bottom-0 left-0 right-0 h-16"
             style={{ background: 'linear-gradient(to bottom, #3D2B7A, #1E0A4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#6B5BA6' }} />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-24">
          {/* Header */}
          <motion.div
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-pixel text-white drop-shadow"
                style={{ fontSize: '0.85rem', textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
              ⚡ LogicRush
            </h1>
            {user ? (
              <ArcadeButton
                onClick={handleLogout}
                style={{ background: '#E74C3C', borderBottomColor: '#A93226', width: 'auto', fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem', padding: '8px 14px' }}
                className="text-white"
              >
                Log Out
              </ArcadeButton>
            ) : (
              <ArcadeButton
                onClick={() => navigate('/')}
                style={{ background: '#4EC0CA', borderBottomColor: '#2A8A94', width: 'auto', fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem', padding: '8px 14px' }}
                className="text-white"
              >
                Log In
              </ArcadeButton>
            )}
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          >
            <div className="game-panel inline-block px-5 py-3">
              <p className="font-pixel" style={{ fontSize: '0.6rem', color: '#5B3A29', letterSpacing: '0.08em' }}>
                SELECT MODE
              </p>
            </div>
          </motion.div>

          {/* Mode cards */}
          <div className="space-y-4">
            {MODES.map((mode, i) => (
              <ModeCard
                key={mode.key}
                mode={mode}
                stats={stats[mode.key]}
                delay={0.2 + i * 0.12}
                onPlay={() => navigate(`/quiz/${mode.key}`)}
                onPractice={() => navigate(`/quiz/${mode.key}?mode=practice`)}
                onLeaderboard={() => navigate(`/leaderboard?cat=${mode.key}`)}
              />
            ))}
          </div>

          {!user && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-center font-bold text-sm mt-4 text-white opacity-80"
            >
              Log in to save scores &amp; appear on the leaderboard
            </motion.p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
