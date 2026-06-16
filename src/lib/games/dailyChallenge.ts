import { supabase } from '@/lib/supabase'
import type { QuizOption, QuizQuestion } from '@/lib/adventure/types'

export interface DailyChallengeAttempt {
  id: string
  child_profile_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  attempted_at: string
}

export interface DailyChallengeQuestion extends QuizQuestion {
  labeledOptions: { letter: string; text: string; is_correct: boolean }[]
}

function hashDate(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  return hash
}

function toLabeledOptions(options: QuizOption[]) {
  const letters = ['A', 'B', 'C', 'D'] as const
  return options.slice(0, 4).map((opt, i) => ({
    letter: letters[i] ?? String.fromCharCode(65 + i),
    text: opt.text,
    is_correct: opt.is_correct,
  }))
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchDailyChallengeQuestion(): Promise<DailyChallengeQuestion | null> {
  const { data, error } = await supabase.from('quiz_questions').select('*')
  if (error) throw error
  if (!data?.length) return null

  const today = todayDateString()
  const index = hashDate(today) % data.length
  const row = data[index]
  const options = row.options as QuizOption[]

  return {
    ...row,
    options,
    labeledOptions: toLabeledOptions(options),
  }
}

export async function fetchTodayAttempt(childId: string): Promise<DailyChallengeAttempt | null> {
  const today = todayDateString()
  const { data, error } = await supabase
    .from('daily_challenge_attempts')
    .select('*')
    .eq('child_profile_id', childId)
    .eq('attempted_at', today)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchDailyChallengeStreak(childId: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_challenge_attempts')
    .select('attempted_at')
    .eq('child_profile_id', childId)
    .order('attempted_at', { ascending: false })

  if (error) throw error
  if (!data?.length) return 0

  const dates = new Set(data.map((r) => r.attempted_at))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // Allow streak to start from today or yesterday if not yet played today
  const todayStr = todayDateString()
  if (!dates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!dates.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export async function submitDailyChallenge(
  childId: string,
  questionId: string,
  selectedAnswer: string
): Promise<DailyChallengeAttempt> {
  const { data, error } = await supabase.rpc('submit_daily_challenge', {
    p_child_id: childId,
    p_question_id: questionId,
    p_selected_answer: selectedAnswer,
  })

  if (error) throw error
  return data as DailyChallengeAttempt
}

export function msUntilNextDailyChallenge(): number {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function correctAnswerText(question: DailyChallengeQuestion): string {
  return question.labeledOptions.find((o) => o.is_correct)?.text ?? ''
}
