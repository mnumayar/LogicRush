import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchQuestions } from '../lib/questions'
import { useQuiz } from '../hooks/useQuiz'
import ArcadeButton from '../components/ArcadeButton'
import PageTransition from '../components/PageTransition'

const CHOICE_COLORS = [
  { bg: '#4EC0CA', border: '#2A8A94' },
  { bg: '#F5A623', border: '#C47D0E' },
  { bg: '#9B59B6', border: '#6C3483' },
  { bg: '#E74C3C', border: '#A93226' },
]
const LABELS = ['A', 'B', 'C', 'D']

const SKY = 'linear-gradient(to bottom, #1E0A4E 0%, #6B2FA0 22%, #C23B7A 48%, #FF7043 72%, #FFB74D 100%)'

function SkeletonQuestion() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: SKY }}>
      <div className="w-full max-w-md animate-pulse space-y-4">
        <div className="h-10 rounded-2xl mx-auto" style={{ background: 'rgba(255,255,255,0.3)', width: '60%' }} />
        <div className="game-panel p-5 h-28" style={{ background: 'rgba(255,255,255,0.6)' }} />
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-14 rounded-2xl" style={{ background: 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
    </div>
  )
}

function NetworkError({ onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: SKY }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="game-panel p-8 max-w-xs w-full">
        <div className="text-5xl mb-4">📡</div>
        <h2 className="font-pixel mb-3" style={{ fontSize: '0.65rem', color: '#2c3e50' }}>NO CONNECTION</h2>
        <p className="font-bold text-sm mb-6" style={{ color: '#666' }}>Check your network and try again.</p>
        <ArcadeButton onClick={onRetry} style={{ background: '#F5A623', borderBottomColor: '#C47D0E' }} className="text-white">RETRY</ArcadeButton>
      </motion.div>
    </div>
  )
}

function ExplanationModal({ question, onSeeResults, isPractice, onContinue }) {
  const choices = JSON.parse(
    typeof question.choices === 'string' ? question.choices : JSON.stringify(question.choices)
  )
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="game-panel w-full max-w-md p-5 pb-10 rounded-b-none max-h-[90vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
          className="rounded-xl px-4 py-3 mb-4 text-center"
          style={{ background: '#FFF0F0', border: '3px solid #E74C3C' }}
        >
          <p className="font-pixel" style={{ fontSize: '0.6rem', color: '#E74C3C' }}>WRONG!</p>
        </motion.div>

        <p className="font-pixel text-center leading-relaxed mb-4" style={{ fontSize: '0.55rem', color: '#2c3e50' }}>
          {question.prompt}
        </p>

        <div className="space-y-2 mb-4">
          {choices.map((choice, i) => {
            const isCorrect = choice === question.answer
            const isWrong   = choice === question.userAnswer && choice !== question.answer
            return (
              <motion.div
                key={choice}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="w-full py-3 px-4 rounded-2xl font-pixel text-left"
                style={{
                  fontSize: '0.5rem',
                  lineHeight: 1.8,
                  background: isCorrect ? '#E8F8E0' : isWrong ? '#FFF0F0' : '#F5F5F5',
                  border: `3px solid ${isCorrect ? '#73C140' : isWrong ? '#E74C3C' : '#DDD'}`,
                  color: isCorrect ? '#4A8C1C' : isWrong ? '#A93226' : '#888',
                }}
              >
                {isCorrect ? '✓ ' : isWrong ? '✗ ' : ''}{choice}
              </motion.div>
            )
          })}
        </div>

        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: '#FFF9E8', border: '2px solid #F5A623' }}>
          <p className="font-pixel" style={{ fontSize: '0.45rem', lineHeight: 2, color: '#5B3A29' }}>{question.explanation}</p>
        </div>

        {isPractice ? (
          <ArcadeButton
            onClick={onContinue}
            style={{ background: '#73C140', borderBottomColor: '#4A8C1C', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}
            className="text-white"
          >
            NEXT QUESTION →
          </ArcadeButton>
        ) : (
          <ArcadeButton
            onClick={onSeeResults}
            style={{ background: '#F5A623', borderBottomColor: '#C47D0E', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
            className="text-white"
          >
            SEE RESULTS
          </ArcadeButton>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function Quiz() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPractice = searchParams.get('mode') === 'practice'
  const [state, dispatch] = useQuiz()
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [fetchingNext, setFetchingNext] = useState(false)
  const [nextBatchError, setNextBatchError] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showQuit, setShowQuit] = useState(false)
  const [questionKey, setQuestionKey] = useState(0)
  const scoreRef = useRef(0)
  const [displayScore, setDisplayScore] = useState(0)
  const animFrameRef = useRef(null)

  // Animate score count-up
  useEffect(() => {
    const target = state.score
    if (target === scoreRef.current) return
    const start = scoreRef.current
    const startTime = performance.now()
    const duration = 200
    function animate(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplayScore(Math.round(start + (target - start) * progress))
      if (progress < 1) { animFrameRef.current = requestAnimationFrame(animate) }
      else { scoreRef.current = target }
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [state.score])

  // iOS swipe-back guard
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePop = () => {
      window.history.pushState(null, '', window.location.href)
      if (state.status === 'active' || state.status === 'wrong') setShowQuit(true)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [state.status])

  const loadInitial = useCallback(async () => {
    setLoading(true); setNetworkError(false)
    try {
      const questions = await fetchQuestions(category, [])
      dispatch({ type: 'START', category, questions })
    } catch { setNetworkError(true) }
    finally { setLoading(false) }
  }, [category, dispatch])

  useEffect(() => { loadInitial() }, [loadInitial])

  async function loadNextBatch() {
    setFetchingNext(true); setNextBatchError(false)
    try {
      const excludeIds = Array.from(state.seenIds)
      const questions = await fetchQuestions(category, excludeIds)
      dispatch({ type: 'NEXT_BATCH', questions })
    } catch { setNextBatchError(true) }
    finally { setFetchingNext(false) }
  }

  useEffect(() => {
    if (state.status === 'active' && state.questions.length > 0 && state.currentIndex >= state.questions.length) {
      loadNextBatch()
    }
  }, [state.currentIndex, state.questions.length, state.status])

  function handleAnswer(choice) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(choice)
    const question = state.questions[state.currentIndex]
    if (choice === question.answer) {
      setTimeout(() => {
        setSelectedAnswer(null)
        setQuestionKey((k) => k + 1)
        dispatch({ type: 'ANSWER_CORRECT' })
      }, 220)
    } else {
      setTimeout(() => {
        setSelectedAnswer(null)
        dispatch({ type: 'ANSWER_WRONG', question, userAnswer: choice })
      }, 220)
    }
  }

  function handleSeeResults() {
    dispatch({ type: 'GAMEOVER' })
    navigate('/gameover', { state: { score: state.score, category, isPractice }, replace: true })
  }

  function handleContinuePractice() {
    dispatch({ type: 'CONTINUE_PRACTICE' })
    setQuestionKey((k) => k + 1)
  }

  function handleQuitConfirm() {
    dispatch({ type: 'QUIT' })
    navigate('/gameover', { state: { score: state.score, category, isPractice }, replace: true })
  }

  if (loading) return <SkeletonQuestion />
  if (networkError) return <NetworkError onRetry={loadInitial} />
  if (fetchingNext || nextBatchError) {
    if (nextBatchError) return <NetworkError onRetry={loadNextBatch} />
    return <SkeletonQuestion />
  }

  const question = state.questions[state.currentIndex]
  if (!question) return <SkeletonQuestion />

  const choices = Array.isArray(question.choices) ? question.choices : JSON.parse(question.choices)

  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: SKY }}>
        <div className="cloud cloud-drift-1" style={{ width: 80,  height: 25, top: '4%', left: '3%' }} />
        <div className="cloud cloud-drift-2" style={{ width: 110, height: 34, top: '10%', right: '5%' }} />

        <div className="absolute bottom-0 left-0 right-0 h-14"
             style={{ background: 'linear-gradient(to bottom, #3D2B7A, #1E0A4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-3" style={{ background: '#6B5BA6' }} />
        </div>

        <div className="relative z-10 flex flex-col max-w-md mx-auto w-full min-h-screen">
          {/* Score bar */}
          <div className="pt-8 pb-3 px-4 flex items-center justify-between">
            <ArcadeButton
              onClick={() => setShowQuit(true)}
              style={{ background: '#E74C3C', borderBottomColor: '#A93226', width: 'auto', padding: '8px 14px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
              className="text-white"
            >
              QUIT
            </ArcadeButton>

            {/* Animated score */}
            <motion.div
              key={displayScore}
              animate={{ scale: [1.25, 1] }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className="text-center"
            >
              <div
                className="font-pixel score-shadow"
                style={{ fontSize: '2.8rem', color: '#fff', textShadow: '3px 3px 0 rgba(0,0,0,0.25)', lineHeight: 1 }}
              >
                {displayScore}
              </div>
              <div className="font-pixel mt-1" style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>
                {isPractice ? '📚 PRACTICE' : '🧠 LOGIC'}
              </div>
            </motion.div>

            <div style={{ width: 70 }} />
          </div>

          {/* Question + choices — re-mount on each new question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={questionKey}
              className="flex-1 px-4 pb-20 flex flex-col justify-center gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <motion.div
                className="game-panel p-5"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <p className="font-pixel text-center leading-relaxed" style={{ fontSize: '0.6rem', color: '#2c3e50' }}>
                  {question.prompt}
                </p>
              </motion.div>

              <div className="space-y-3">
                {choices.map((choice, i) => {
                  const isSelected = selectedAnswer === choice
                  const isCorrect  = isSelected && choice === question.answer
                  const isWrong    = isSelected && choice !== question.answer
                  const colors     = CHOICE_COLORS[i % CHOICE_COLORS.length]

                  let bg     = colors.bg
                  let border = colors.border
                  if (isCorrect) { bg = '#73C140'; border = '#4A8C1C' }
                  if (isWrong)   { bg = '#E74C3C'; border = '#A93226' }

                  return (
                    <motion.button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      className="btn-arcade text-white text-left flex items-center gap-3"
                      style={{ background: bg, borderBottomColor: border, fontSize: '1rem', padding: '14px 18px' }}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.08 + i * 0.07 }}
                      whileHover={{ filter: 'brightness(1.08)' }}
                      whileTap={{ scale: 0.93, y: 4 }}
                    >
                      <span
                        className="font-pixel shrink-0"
                        style={{ fontSize: '0.55rem', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '4px 7px' }}
                      >
                        {LABELS[i]}
                      </span>
                      <span className="font-pixel leading-relaxed" style={{ fontSize: '0.5rem' }}>{choice}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Explanation modal */}
        <AnimatePresence>
          {state.status === 'wrong' && state.lastWrongQuestion && (
            <ExplanationModal
              question={state.lastWrongQuestion}
              onSeeResults={handleSeeResults}
              isPractice={isPractice}
              onContinue={handleContinuePractice}
            />
          )}
        </AnimatePresence>

        {/* Quit confirm */}
        <AnimatePresence>
          {showQuit && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="game-panel p-6 w-full max-w-xs text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{ scale: 0.8,    opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <p className="font-pixel mb-2" style={{ fontSize: '0.65rem', color: '#2c3e50' }}>END RUN?</p>
                <p className="font-pixel mb-6" style={{ fontSize: '0.45rem', lineHeight: 2, color: '#666' }}>
                  Score of {state.score} will be submitted.
                </p>
                <div className="flex gap-3">
                  <ArcadeButton onClick={() => setShowQuit(false)} style={{ background: '#73C140', borderBottomColor: '#4A8C1C', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }} className="text-white flex-1">Resume</ArcadeButton>
                  <ArcadeButton onClick={handleQuitConfirm} style={{ background: '#E74C3C', borderBottomColor: '#A93226', fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }} className="text-white flex-1">End</ArcadeButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
