import { supabase } from './supabase'

export async function fetchQuestions(category, excludeIds = []) {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('category', category)
    .limit(50)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error

  // Shuffle within each difficulty group, then order easy → medium → hard
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)
  const easy = shuffle(data.filter((q) => q.difficulty === 'easy'))
  const medium = shuffle(data.filter((q) => q.difficulty === 'medium'))
  const hard = shuffle(data.filter((q) => q.difficulty === 'hard'))
  return [...easy, ...medium, ...hard]
}
