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

  // Shuffle client-side
  return data.sort(() => Math.random() - 0.5)
}
