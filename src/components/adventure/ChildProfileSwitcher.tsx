import { useSelectedChild } from '@/context/SelectedChildContext'
import UserAvatar from '@/components/UserAvatar'

export default function ChildProfileSwitcher() {
  const { children, selectedChild, setSelectedChildId, loading } = useSelectedChild()

  if (loading) return null
  if (children.length === 0) {
    return (
      <p className="text-sm text-muted bg-white rounded-xl px-4 py-3 border border-gray-200">
        Add a child profile from your dashboard to track adventure progress.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-muted uppercase tracking-wide">Learning as:</span>
      {children.map((child) => {
        const isSelected = selectedChild?.id === child.id
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => setSelectedChildId(child.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all ${
              isSelected
                ? 'bg-gold text-white shadow-md'
                : 'bg-white text-navy border border-gray-200 hover:border-gold'
            }`}
          >
            <UserAvatar
              name={child.name}
              avatarId={child.avatar_id}
              size={28}
            />
            {child.name}
          </button>
        )
      })}
    </div>
  )
}
