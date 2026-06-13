import { createContext, useContext } from 'react'
import {
  DEFAULT_ADMIN_DISPLAY_NAME,
  DEFAULT_ADMIN_TITLE,
  DEFAULT_PUBLIC_CONTACT_EMAIL,
} from '@/lib/admin/adminProfile'

interface AdminShellContextValue {
  adminName: string
  adminTitle: string
  publicContactEmail: string
  avatarId: string | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  refreshAdminProfile: () => Promise<void>
}

export const AdminShellContext = createContext<AdminShellContextValue>({
  adminName: DEFAULT_ADMIN_DISPLAY_NAME,
  adminTitle: DEFAULT_ADMIN_TITLE,
  publicContactEmail: DEFAULT_PUBLIC_CONTACT_EMAIL,
  avatarId: null,
  searchQuery: '',
  setSearchQuery: () => {},
  refreshAdminProfile: async () => {},
})

export const useAdminShell = () => useContext(AdminShellContext)
