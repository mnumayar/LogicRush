import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ArcadeButton from '../components/ArcadeButton'
import PageTransition from '../components/PageTransition'

export default function Landing() {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username).single()
      if (existing) { setError('Username taken, try another'); setLoading(false); return }

      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }

      const { error: profileError } = await supabase
        .from('profiles').insert({ id: data.user.id, username })
      if (profileError) throw profileError
      navigate('/play')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleLogIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) throw loginError
      navigate('/play')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function openMode(m) {
    setMode(m); setError(''); setEmail(''); setPassword(''); setUsername('')
  }

  return (
    <PageTransition>
      <div
        className="relative min-h-screen flex flex-col items-center justify-center px-5 overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #1E0A4E 0%, #6B2FA0 22%, #C23B7A 48%, #FF7043 72%, #FFB74D 100%)' }}
      >
        {/* Drifting clouds */}
        <div className="cloud cloud-drift-1" style={{ width: 90,  height: 30, top: '8%',  left: '5%' }} />
        <div className="cloud cloud-drift-2" style={{ width: 130, height: 38, top: '14%', right: '6%' }} />
        <div className="cloud cloud-drift-3" style={{ width: 70,  height: 22, top: '28%', left: '60%' }} />

        {/* Ground strip */}
        <div className="absolute bottom-0 left-0 right-0 h-20"
             style={{ background: 'linear-gradient(to bottom, #3D2B7A, #1E0A4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#6B5BA6' }} />
        </div>

        {/* Logo */}
        <motion.div
          className="text-center mb-10 relative z-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        >
          {/* Animated lightning bolt */}
          <div className="bolt-animate text-7xl mb-3">⚡</div>

          <h1
            className="font-pixel text-white mb-2 drop-shadow-lg"
            style={{ fontSize: '1.6rem', textShadow: '3px 3px 0 #2A0A5E, 6px 6px 0 rgba(0,0,0,0.2)' }}
          >
            LogicRush
          </h1>
          <motion.div
            className="game-panel inline-block px-4 py-2 mt-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
          >
            <p className="font-pixel text-[#E74C3C]" style={{ fontSize: '0.45rem', letterSpacing: '0.05em' }}>
              ONE WRONG ANSWER ENDS YOUR RUN
            </p>
          </motion.div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-xs relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <ArcadeButton
            onClick={() => navigate('/play')}
            style={{ background: '#F5A623', borderBottomColor: '#C47D0E', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}
            className="text-white"
          >
            ▶ PLAY NOW
          </ArcadeButton>

          <div className="flex gap-3">
            <ArcadeButton
              onClick={() => openMode('signup')}
              style={{ background: '#73C140', borderBottomColor: '#4A8C1C', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
              className="text-white flex-1"
            >
              Sign Up
            </ArcadeButton>
            <ArcadeButton
              onClick={() => openMode('login')}
              style={{ background: '#4EC0CA', borderBottomColor: '#2A8A94', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
              className="text-white flex-1"
            >
              Log In
            </ArcadeButton>
          </div>

          <p className="font-pixel text-center text-white opacity-80 mt-1" style={{ fontSize: '0.38rem', lineHeight: 1.8 }}>
            Sign up to save scores &amp; join the leaderboard
          </p>
        </motion.div>

        {/* Auth Modal */}
        {mode && (
          <motion.div
            className="fixed inset-0 flex items-end justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="game-panel w-full max-w-md p-6 pb-10 rounded-b-none"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-pixel text-[#5B3A29]" style={{ fontSize: '0.7rem' }}>
                  {mode === 'login' ? 'LOG IN' : 'SIGN UP'}
                </h2>
                <ArcadeButton
                  onClick={() => setMode(null)}
                  style={{ background: '#E74C3C', borderBottomColor: '#A93226', width: 40, height: 40, borderRadius: 10, padding: 0 }}
                  className="text-white text-xl flex items-center justify-center"
                >
                  ×
                </ArcadeButton>
              </div>

              <form onSubmit={mode === 'login' ? handleLogIn : handleSignUp} className="space-y-3">
                {mode === 'signup' && (
                  <motion.input
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                    type="text" placeholder="Username" value={username}
                    onChange={(e) => setUsername(e.target.value)} required
                    className="w-full rounded-xl px-4 py-3 text-[#2c3e50] placeholder-gray-400 focus:outline-none"
                    style={{ background: '#F0F4F8', border: '3px solid #DDD', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
                  />
                )}
                <motion.input
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  type="email" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="w-full rounded-xl px-4 py-3 text-[#2c3e50] placeholder-gray-400 focus:outline-none"
                  style={{ background: '#F0F4F8', border: '3px solid #DDD', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
                />
                <motion.input
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  type="password" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="w-full rounded-xl px-4 py-3 text-[#2c3e50] placeholder-gray-400 focus:outline-none"
                  style={{ background: '#F0F4F8', border: '3px solid #DDD', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="game-panel px-4 py-2"
                    style={{ borderColor: '#E74C3C', boxShadow: '0 4px 0 #E74C3C' }}
                  >
                    <p className="font-pixel text-[#E74C3C]" style={{ fontSize: '0.45rem', lineHeight: 1.8 }}>{error}</p>
                  </motion.div>
                )}

                <ArcadeButton
                  type="submit"
                  disabled={loading}
                  style={{ background: '#F5A623', borderBottomColor: '#C47D0E', opacity: loading ? 0.7 : 1, fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
                  className="text-white"
                >
                  {loading ? 'Loading…' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
                </ArcadeButton>
              </form>

              <div className="font-pixel text-center mt-5" style={{ fontSize: '0.42rem', color: '#888', lineHeight: 2 }}>
                {mode === 'login' ? 'No account? ' : 'Have an account? '}
                <button
                  onClick={() => openMode(mode === 'login' ? 'signup' : 'login')}
                  className="underline"
                  style={{ color: '#4EC0CA', fontFamily: '"Press Start 2P", monospace' }}
                >
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
