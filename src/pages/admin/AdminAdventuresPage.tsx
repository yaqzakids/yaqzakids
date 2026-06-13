import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  deleteBadge,
  deleteHeroCard,
  fetchAdminBadges,
  fetchAdminHeroCards,
  fetchAdminPillars,
  fetchPathOptions,
  saveBadge,
  saveHeroCard,
  updatePillar,
} from '@/lib/admin/adventures'
import AdminPathsPage from './AdminPathsPage'
import type { AdminBadge, AdminHeroCard } from '@/lib/admin/types'
import type { Pillar } from '@/lib/adventure/types'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import { slugify } from '@/lib/admin/utils'

type Tab = 'pillars' | 'paths' | 'badges' | 'hero_cards'

export default function AdminAdventuresPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const initialTab: Tab = tabParam && ['pillars', 'paths', 'badges', 'hero_cards'].includes(tabParam) ? tabParam : 'paths'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [badges, setBadges] = useState<AdminBadge[]>([])
  const [heroCards, setHeroCards] = useState<AdminHeroCard[]>([])
  const [paths, setPaths] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ type: 'badge' | 'hero'; id: string; name: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, b, h, pathOpts] = await Promise.all([
        fetchAdminPillars(),
        fetchAdminBadges(),
        fetchAdminHeroCards(),
        fetchPathOptions(),
      ])
      setPillars(p)
      setBadges(b)
      setHeroCards(h)
      setPaths(pathOpts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tabParam && tabParam !== tab) {
      setTab(tabParam as Tab)
    }
  }, [tabParam])

  const switchTab = (next: Tab) => {
    setTab(next)
    setSearchParams({ tab: next })
  }

  useEffect(() => {
    load()
  }, [])

  const handlePillarSave = async (pillar: Pillar) => {
    await updatePillar(pillar.id, {
      name: pillar.name,
      description: pillar.description,
      icon: pillar.icon,
      sort_order: pillar.sort_order,
    })
    setPillars((prev) => prev.map((p) => (p.id === pillar.id ? pillar : p)))
  }

  const handleAddBadge = async () => {
    const created = await saveBadge({ name: 'New Badge', slug: `badge-${Date.now()}`, description: '', icon: '🏅' })
    setBadges((prev) => [...prev, created])
  }

  const handleAddHero = async () => {
    const created = await saveHeroCard({
      name: 'New Hero',
      slug: `hero-${Date.now()}`,
      description: '',
      sort_order: heroCards.length,
      is_premium: false,
      star_rating: 3,
    })
    setHeroCards((prev) => [...prev, created])
  }

  const handleConfirmDelete = async () => {
    if (!confirm) return
    if (confirm.type === 'badge') {
      await deleteBadge(confirm.id)
      setBadges((prev) => prev.filter((b) => b.id !== confirm.id))
    } else {
      await deleteHeroCard(confirm.id)
      setHeroCards((prev) => prev.filter((h) => h.id !== confirm.id))
    }
    setConfirm(null)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['paths', 'Paths'],
          ['pillars', 'Pillars'],
          ['badges', 'Badges'],
          ['hero_cards', 'Hero Cards'],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" style={tab === key ? adminBtn.primary : adminBtn.secondary} onClick={() => switchTab(key)}>
            {label}
          </button>
        ))}
        <Link to="/admin/paths/new" style={{ ...adminBtn.secondary, textDecoration: 'none', marginLeft: 'auto' }}>+ New Path</Link>
      </div>

      {tab === 'paths' && <AdminPathsPage />}

      {tab === 'pillars' && (
        loading ? <TableSkeleton rows={4} cols={5} /> : (
          <div style={{ ...adminCard, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Icon', 'Description', 'Order', 'Actions'].map((h) => <th key={h} style={adminTableTh}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {pillars.map((pillar) => (
                  <tr key={pillar.id}>
                    <td style={adminTableTd}><input style={adminInput} value={pillar.name} onChange={(e) => setPillars((prev) => prev.map((p) => p.id === pillar.id ? { ...p, name: e.target.value } : p))} /></td>
                    <td style={adminTableTd}><input style={{ ...adminInput, width: 60 }} value={pillar.icon ?? ''} onChange={(e) => setPillars((prev) => prev.map((p) => p.id === pillar.id ? { ...p, icon: e.target.value } : p))} /></td>
                    <td style={adminTableTd}><input style={adminInput} value={pillar.description ?? ''} onChange={(e) => setPillars((prev) => prev.map((p) => p.id === pillar.id ? { ...p, description: e.target.value } : p))} /></td>
                    <td style={adminTableTd}><input type="number" style={{ ...adminInput, width: 80 }} value={pillar.sort_order} onChange={(e) => setPillars((prev) => prev.map((p) => p.id === pillar.id ? { ...p, sort_order: Number(e.target.value) } : p))} /></td>
                    <td style={adminTableTd}><button type="button" style={adminBtn.primary} onClick={() => handlePillarSave(pillar)}>Save</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'badges' && (
        <>
          <button type="button" style={{ ...adminBtn.primary, marginBottom: 12 }} onClick={handleAddBadge}>+ Add Badge</button>
          {loading ? <TableSkeleton rows={3} cols={4} /> : (
            <div style={{ ...adminCard, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name', 'Icon', 'Condition', 'Actions'].map((h) => <th key={h} style={adminTableTh}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {badges.map((badge) => (
                    <tr key={badge.id}>
                      <td style={adminTableTd}><input style={adminInput} value={badge.name} onChange={(e) => setBadges((prev) => prev.map((b) => b.id === badge.id ? { ...b, name: e.target.value } : b))} /></td>
                      <td style={adminTableTd}><input style={{ ...adminInput, width: 60 }} value={badge.icon ?? ''} onChange={(e) => setBadges((prev) => prev.map((b) => b.id === badge.id ? { ...b, icon: e.target.value } : b))} /></td>
                      <td style={adminTableTd}>
                        <input style={{ ...adminInput, marginBottom: 4 }} placeholder="condition_type" value={badge.condition_type ?? ''} onChange={(e) => setBadges((prev) => prev.map((b) => b.id === badge.id ? { ...b, condition_type: e.target.value } : b))} />
                        <input style={adminInput} placeholder="condition_value" value={badge.condition_value ?? ''} onChange={(e) => setBadges((prev) => prev.map((b) => b.id === badge.id ? { ...b, condition_value: e.target.value } : b))} />
                      </td>
                      <td style={adminTableTd}>
                        <button type="button" style={{ ...adminBtn.secondary, marginRight: 8 }} onClick={async () => { const saved = await saveBadge({ ...badge, slug: badge.slug || slugify(badge.name) }); setBadges((prev) => prev.map((b) => b.id === saved.id ? saved : b)) }}>Save</button>
                        <button type="button" style={adminBtn.danger} onClick={() => setConfirm({ type: 'badge', id: badge.id, name: badge.name })}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'hero_cards' && (
        <>
          <button type="button" style={{ ...adminBtn.primary, marginBottom: 12 }} onClick={handleAddHero}>+ Add Hero Card</button>
          {loading ? <TableSkeleton rows={3} cols={5} /> : (
            <div style={{ ...adminCard, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name', 'Trait', 'Era', 'Stars', 'Premium', 'Actions'].map((h) => <th key={h} style={adminTableTh}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {heroCards.map((card) => (
                    <tr key={card.id}>
                      <td style={adminTableTd}><input style={adminInput} value={card.name} onChange={(e) => setHeroCards((prev) => prev.map((c) => c.id === card.id ? { ...c, name: e.target.value } : c))} /></td>
                      <td style={adminTableTd}><input style={adminInput} value={card.trait ?? ''} onChange={(e) => setHeroCards((prev) => prev.map((c) => c.id === card.id ? { ...c, trait: e.target.value } : c))} /></td>
                      <td style={adminTableTd}><input style={adminInput} value={card.era ?? ''} onChange={(e) => setHeroCards((prev) => prev.map((c) => c.id === card.id ? { ...c, era: e.target.value } : c))} /></td>
                      <td style={adminTableTd}><input type="number" min={1} max={5} style={{ ...adminInput, width: 70 }} value={card.star_rating ?? 3} onChange={(e) => setHeroCards((prev) => prev.map((c) => c.id === card.id ? { ...c, star_rating: Number(e.target.value) } : c))} /></td>
                      <td style={adminTableTd}>
                        <select style={adminInput} value={card.is_premium ? 'premium' : 'free'} onChange={(e) => setHeroCards((prev) => prev.map((c) => c.id === card.id ? { ...c, is_premium: e.target.value === 'premium' } : c))}>
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td style={adminTableTd}>
                        <button type="button" style={{ ...adminBtn.secondary, marginRight: 8 }} onClick={async () => { const saved = await saveHeroCard({ ...card, slug: card.slug || slugify(card.name), unlock_path_id: card.unlock_path_id }); setHeroCards((prev) => prev.map((c) => c.id === saved.id ? saved : c)) }}>Save</button>
                        <button type="button" style={adminBtn.danger} onClick={() => setConfirm({ type: 'hero', id: card.id, name: card.name })}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paths.length > 0 && (
                <p style={{ padding: 12, margin: 0, fontSize: 13, color: '#6b7280' }}>
                  Unlock paths can be assigned in the path editor. {paths.length} paths available.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete item?"
        message={`Are you sure you want to delete "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
