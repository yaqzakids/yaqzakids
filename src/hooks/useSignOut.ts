import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { signOutAndClearLocalState } from '@/lib/auth/signOut'
import { PUBLIC_HOME_PATH } from '@/lib/navigation'

export function useSignOut() {
  const navigate = useNavigate()
  const { clearActiveChild } = useSelectedChild()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = useCallback(async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      clearActiveChild()
      await signOutAndClearLocalState()
      navigate(PUBLIC_HOME_PATH, { replace: true })
    } catch (err) {
      console.error('Sign out failed:', err)
      setSigningOut(false)
    }
  }, [clearActiveChild, navigate, signingOut])

  return { signOut, signingOut }
}
