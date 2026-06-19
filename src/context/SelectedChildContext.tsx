import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { getChildProfilesReliably } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import { dashboardPathForAgeGroup } from '@/lib/childProfiles'
import { STORAGE_KEYS as APP_STORAGE_KEYS } from '@/lib/constants'
import { persistActiveChildSelection, ACTIVE_CHILD_CHANGED } from '@/lib/activeChild'
import { lockParentSession } from '@/lib/parentGate'
import type { ChildProfile } from '@/lib/types'

interface SelectedChildContextValue {
  children: ChildProfile[]
  selectedChild: ChildProfile | null
  /** Active child profile ID (persisted in localStorage) */
  activeChildProfileId: string | null
  setSelectedChildId: (id: string) => void
  /** Select child, persist age group, return dashboard path for navigation */
  enterChildExperience: (id: string) => string
  clearActiveChild: () => void
  loading: boolean
  refreshChildren: () => Promise<void>
}

const SelectedChildContext = createContext<SelectedChildContextValue | null>(null)

function persistActiveChild(child: ChildProfile | null) {
  if (child) {
    persistActiveChildSelection(child)
  } else {
    localStorage.removeItem(STORAGE_KEYS.selectedChildId)
    localStorage.removeItem(STORAGE_KEYS.activeChild)
    window.dispatchEvent(new CustomEvent(ACTIVE_CHILD_CHANGED))
  }
}

export function SelectedChildProvider({ children: node }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshChildren = async () => {
    if (authLoading) return

    if (!user) {
      setChildren([])
      setSelectedChild(null)
      localStorage.removeItem(STORAGE_KEYS.selectedChildId)
      localStorage.removeItem(APP_STORAGE_KEYS.ageGroup)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const kids = await getChildProfilesReliably(user.id)
      setChildren(kids)
      const stored = localStorage.getItem(STORAGE_KEYS.selectedChildId)
      let match = stored ? kids.find((k) => k.id === stored) ?? null : null

      if (!match && kids.length === 1) {
        match = kids[0]
        persistActiveChild(match)
      } else if (stored && !match) {
        localStorage.removeItem(STORAGE_KEYS.selectedChildId)
      }

      setSelectedChild(match)
      if (match) {
        localStorage.setItem(APP_STORAGE_KEYS.ageGroup, match.age_group)
      }
    } catch (err) {
      console.error('Failed to load child profiles:', err)
      setChildren([])
      setSelectedChild(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshChildren()
  }, [user?.id, authLoading])

  useEffect(() => {
    const onActiveChildChanged = () => {
      void refreshChildren()
    }
    window.addEventListener(ACTIVE_CHILD_CHANGED, onActiveChildChanged)
    return () => window.removeEventListener(ACTIVE_CHILD_CHANGED, onActiveChildChanged)
  }, [user?.id, authLoading])

  const setSelectedChildId = (id: string) => {
    const child = children.find((c) => c.id === id) ?? null
    setSelectedChild(child)
    persistActiveChild(child)
  }

  const enterChildExperience = (id: string): string => {
    const child = children.find((c) => c.id === id)
    if (!child) return '/children'
    lockParentSession()
    persistActiveChild(child)
    flushSync(() => {
      setSelectedChild(child)
    })
    return dashboardPathForAgeGroup(child.age_group)
  }

  const clearActiveChild = () => {
    setSelectedChild(null)
    localStorage.removeItem(STORAGE_KEYS.selectedChildId)
    localStorage.removeItem(STORAGE_KEYS.activeChild)
    localStorage.removeItem(APP_STORAGE_KEYS.ageGroup)
  }

  return (
    <SelectedChildContext.Provider
      value={{
        children,
        selectedChild,
        activeChildProfileId: selectedChild?.id ?? null,
        setSelectedChildId,
        enterChildExperience,
        clearActiveChild,
        loading,
        refreshChildren,
      }}
    >
      {node}
    </SelectedChildContext.Provider>
  )
}

export function useSelectedChild() {
  const ctx = useContext(SelectedChildContext)
  if (!ctx) throw new Error('useSelectedChild must be used within SelectedChildProvider')
  return ctx
}
