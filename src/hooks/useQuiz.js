import { useReducer } from 'react'

const initialState = {
  status: 'idle',
  category: null,
  questions: [],
  seenIds: new Set(),
  currentIndex: 0,
  score: 0,
  lastWrongQuestion: null,
}

function quizReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        status: 'active',
        category: action.category,
        questions: action.questions,
        seenIds: new Set(action.questions.map((q) => q.id)),
      }
    case 'ANSWER_CORRECT':
      return {
        ...state,
        score: state.score + 1,
        currentIndex: state.currentIndex + 1,
      }
    case 'ANSWER_WRONG':
      return {
        ...state,
        status: 'wrong',
        lastWrongQuestion: {
          ...action.question,
          userAnswer: action.userAnswer,
        },
      }
    case 'NEXT_BATCH': {
      const newSeenIds = new Set(state.seenIds)
      action.questions.forEach((q) => newSeenIds.add(q.id))
      return {
        ...state,
        status: 'active',
        questions: action.questions,
        currentIndex: 0,
        seenIds: newSeenIds,
      }
    }
    case 'CONTINUE_PRACTICE':
      return {
        ...state,
        status: 'active',
        currentIndex: state.currentIndex + 1,
      }
    case 'GAMEOVER':
      return { ...state, status: 'gameover' }
    case 'RESTART':
      return { ...initialState }
    case 'QUIT':
      return { ...initialState }
    default:
      return state
  }
}

export function useQuiz() {
  return useReducer(quizReducer, initialState)
}
