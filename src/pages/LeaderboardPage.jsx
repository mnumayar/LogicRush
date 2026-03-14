import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ArcadeButton from '../components/ArcadeButton'
import PageTransition from '../components/PageTransition'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCat     = searchParams.get('cat') === 'logic' ? 'logic' : 'math'
  const initialMode    = searchParams.get('lbMode') === 'practice' ? 'practice' : 'compete'
  const [category, setCategory] = useState(initialCat)
  const [lbMode, setLbMode]     = useState(initialMode)
  const [rows, setRows]         = useState(null)
  const [error, setError]       = useState(false)
  const [username, setUsername] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    supabase.from('profiles').select('username').eq('id', user.id).single()
      .then(({ data }) => { if (data) setUsername(data.username) })
  }, [user])

  async function load() {
    setError(false); setRows(null)
    const view = lbMode === 'practice' ? 'practice_leaderboard' : 'leaderboard'
    const { data, error: err } = await supabase
      .from(view).select('username, high_score, rank')
      .eq('category', category).order('rank', { ascending: true }).limit(200)
    if (err) { setError(true); return }
    setRows(data ?? [])
  }

  useEffect(() => { load() }, [category, lbMode])

  function switchCat(cat) { setCategory(cat); setSearchParams({ cat, lbMode }) }
  function switchMode(m) { setLbMode(m); setSearchParams({ cat: category, lbMode: m }) }

  const touchStartY = useRef(0)
  function handleTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function handleTouchEnd(e) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80 && scrollRef.current?.scrollTop === 0) load()
  }

  const top50       = rows?.slice(0, 50) ?? []
  const userRow     = rows?.find((r) => r.username === username)
  const userInTop50 = top50.some((r) => r.username === username)

  return (
    <PageTransition>
      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #1E0A4E 0%, #6B2FA0 22%, #C23B7A 48%, #FF7043 72%, #FFB74D 100%)' }}
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cloud cloud-drift-1" style={{ width: 90,  height: 28, top: '5%',  left: '4%' }} />
        <div className="cloud cloud-drift-2" style={{ width: 120, height: 36, top: '11%', right: '5%' }} />

        <div className="absolute bottom-0 left-0 right-0 h-14"
             style={{ background: 'linear-gradient(to bottom, #3D2B7A, #1E0A4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#6B5BA6' }} />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-24">
          {/* Header */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <ArcadeButton
              onClick={() => navigate(-1)}
              style={{ background: '#4EC0CA', borderBottomColor: '#2A8A94', width: 'auto', padding: '8px 14px', fontSize: '0.8rem' }}
              className="text-white"
            >
              ← Back
            </ArcadeButton>
            <div className="flex-1 text-center">
              <p className="font-pixel drop-shadow"
                 style={{ fontSize: '0.6rem', color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
                {lbMode === 'practice' ? '📚 PRACTICE BOARD' : '🏆 LEADERBOARD'}
              </p>
            </div>
            <div style={{ width: 70 }} />
          </motion.div>

          {/* Mode toggle: Compete / Practice */}
          <motion.div
            className="game-panel flex p-1 mb-3"
            style={{ gap: 6 }}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 20 }}
          >
            {[
              { key: 'compete',  label: '🏆 COMPETE' },
              { key: 'practice', label: '📚 PRACTICE' },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => switchMode(key)}
                className="flex-1 py-2 rounded-xl font-pixel"
                whileHover={{ filter: 'brightness(1.07)' }}
                whileTap={{ scale: 0.95 }}
                style={
                  lbMode === key
                    ? { background: key === 'compete' ? '#E74C3C' : '#F5A623', color: '#fff',
                        border: `3px solid ${key === 'compete' ? '#A93226' : '#C47D0E'}`,
                        boxShadow: `0 3px 0 ${key === 'compete' ? '#A93226' : '#C47D0E'}`,
                        fontSize: '0.45rem' }
                    : { background: 'transparent', color: '#888', fontSize: '0.45rem' }
                }
              >
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Category tabs */}
          <motion.div
            className="game-panel flex p-1 mb-5"
            style={{ gap: 6 }}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
          >
            {['math', 'logic'].map((cat) => (
              <motion.button
                key={cat}
                onClick={() => switchCat(cat)}
                className="flex-1 py-2 rounded-xl font-bold text-sm"
                whileHover={{ filter: 'brightness(1.07)' }}
                whileTap={{ scale: 0.95 }}
                style={
                  category === cat
                    ? { background: cat === 'math' ? '#73C140' : '#9B59B6', color: '#fff',
                        border: `3px solid ${cat === 'math' ? '#4A8C1C' : '#6C3483'}`,
                        boxShadow: `0 3px 0 ${cat === 'math' ? '#4A8C1C' : '#6C3483'}` }
                    : { background: 'transparent', color: '#888' }
                }
              >
                {cat === 'math' ? '🧮 Math' : '🧠 Logic'}
              </motion.button>
            ))}
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="game-panel p-6 text-center">
              <p className="font-bold text-sm mb-4" style={{ color: '#666' }}>📡 No connection. Check your network.</p>
              <ArcadeButton onClick={load} style={{ background: '#F5A623', borderBottomColor: '#C47D0E' }} className="text-white">RETRY</ArcadeButton>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {!error && rows === null && (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="h-14 rounded-2xl animate-pulse"
                            style={{ background: 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!error && rows !== null && rows.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="game-panel p-10 text-center">
              <div className="text-5xl mb-4">🏅</div>
              <p className="font-bold" style={{ color: '#888' }}>No scores yet — be the first on the board!</p>
            </motion.div>
          )}

          {/* Table */}
          {!error && rows !== null && rows.length > 0 && (
            <motion.div
              className="game-panel overflow-hidden"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 22 }}
            >
              {/* Header row */}
              <div className="grid grid-cols-12 px-4 py-3"
                   style={{ background: category === 'math' ? '#73C140' : '#9B59B6', borderRadius: '15px 15px 0 0' }}>
                <span className="col-span-2 font-pixel text-white" style={{ fontSize: '0.5rem' }}>RANK</span>
                <span className="col-span-7 font-pixel text-white" style={{ fontSize: '0.5rem' }}>PLAYER</span>
                <span className="col-span-3 font-pixel text-white text-right" style={{ fontSize: '0.5rem' }}>SCORE</span>
              </div>

              {top50.map((row, idx) => {
                const isMe = row.username === username
                return (
                  <motion.div
                    key={row.username}
                    className="grid grid-cols-12 px-4 py-3"
                    style={{
                      background: isMe ? '#FFF9E8' : idx % 2 === 0 ? '#fff' : '#F8F8F8',
                      borderTop: '1px solid #EEE',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.025, duration: 0.18 }}
                  >
                    <span className="col-span-2 font-bold" style={{ color: row.rank <= 3 ? '#F5A623' : '#AAA', fontSize: '0.95rem' }}>
                      {row.rank <= 3 ? MEDAL[row.rank - 1] : `#${row.rank}`}
                    </span>
                    <span className="col-span-7 font-extrabold truncate" style={{ color: isMe ? '#F5A623' : '#2c3e50' }}>
                      {row.username}{isMe ? ' 👈' : ''}
                    </span>
                    <span className="col-span-3 font-pixel text-right" style={{ fontSize: '0.65rem', color: '#2c3e50' }}>
                      {row.high_score}
                    </span>
                  </motion.div>
                )
              })}

              {/* Pinned user row */}
              {userRow && !userInTop50 && (
                <>
                  <div className="py-2 text-center font-bold" style={{ color: '#CCC', background: '#F8F8F8', fontSize: '0.8rem' }}>• • •</div>
                  <div className="grid grid-cols-12 px-4 py-3" style={{ background: '#FFF9E8', borderTop: '1px solid #EEE' }}>
                    <span className="col-span-2 font-bold" style={{ color: '#AAA' }}>#{userRow.rank}</span>
                    <span className="col-span-7 font-extrabold truncate" style={{ color: '#F5A623' }}>{userRow.username} 👈</span>
                    <span className="col-span-3 font-pixel text-right" style={{ fontSize: '0.65rem', color: '#2c3e50' }}>{userRow.high_score}</span>
                  </div>
                </>
              )}
            </motion.div>
          )}

          <p className="text-center font-bold text-xs mt-4 opacity-60 text-white">Pull down to refresh</p>
        </div>
      </div>
    </PageTransition>
  )
}
