import { useState } from 'react'
import AdminUsersPage from './AdminUsersPage'
import AdminChildrenPage from './AdminChildrenPage'
import { adminBtn } from '@/lib/admin/styles'

type Tab = 'parents' | 'children'

export default function AdminFamiliesPage() {
  const [tab, setTab] = useState<Tab>('parents')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" style={tab === 'parents' ? adminBtn.primary : adminBtn.secondary} onClick={() => setTab('parents')}>
          Parent Accounts
        </button>
        <button type="button" style={tab === 'children' ? adminBtn.primary : adminBtn.secondary} onClick={() => setTab('children')}>
          Child Profiles
        </button>
      </div>
      {tab === 'parents' ? <AdminUsersPage /> : <AdminChildrenPage />}
    </div>
  )
}
