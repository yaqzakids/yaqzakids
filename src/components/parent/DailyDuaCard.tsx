import type { ComponentProps } from 'react'
import DailyFaithPracticeSection from '@/components/islamic/DailyFaithPracticeSection'

/** @deprecated Use DailyFaithPracticeSection instead. */
export default function DailyDuaCard(props: ComponentProps<typeof DailyFaithPracticeSection>) {
  return <DailyFaithPracticeSection {...props} />
}
