import { useMemo, useState, type ReactNode } from 'react'
import AvatarPreview from '@/components/avatar/AvatarPreview'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import {
  ACCESSORY_OPTIONS,
  AVATAR_BASE_OPTIONS,
  AVATAR_BUILDER_TABS,
  BACKGROUND_OPTIONS,
  DEFAULT_AVATAR_CONFIG,
  getDefaultHeadwearForBase,
  getHeadwearForCategory,
  normalizeConfigForBase,
  randomizeAvatarConfig,
  type AvatarBuilderTab,
  type AvatarConfig,
  type HeadwearCategory,
  type HeadwearId,
} from '@/lib/avatarOptions'

interface AvatarBuilderProps {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
  onSave: () => void | Promise<void>
  saving?: boolean
  saveLabel?: string
  variant?: 'admin' | 'default'
  showSaveButton?: boolean
}

const GOLD = dashboardTheme.gold
const NAVY = dashboardTheme.navy
const TEAL = dashboardTheme.teal

function MiniPreview({ config }: { config: AvatarConfig }) {
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden ring-1 ring-black/5">
      <AvatarPreview config={config} size={56} />
    </div>
  )
}

function OptionCard({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 bg-white cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02]"
      style={{
        borderColor: selected ? GOLD : '#EDE8DF',
        boxShadow: selected ? `0 0 0 2px ${GOLD}55` : undefined,
      }}
    >
      {children}
      <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: NAVY }}>
        {label}
      </span>
    </button>
  )
}

function HeadwearGrid({
  category,
  base,
  value,
  previewBase,
  onSelect,
}: {
  category: HeadwearCategory
  base: AvatarConfig['base']
  value: HeadwearId
  previewBase: AvatarConfig
  onSelect: (headwear: HeadwearId) => void
}) {
  const options = getHeadwearForCategory(category, base)

  if (options.length === 0) {
    return (
      <p className="text-sm m-0 py-6 text-center" style={{ color: dashboardTheme.muted }}>
        {category === 'hijab'
          ? 'Hijab styles are available for the Girl base.'
          : 'Try switching to the Boy base for kufi styles.'}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((opt) => (
        <OptionCard
          key={opt.id}
          selected={value === opt.id}
          onClick={() => onSelect(opt.id)}
          label={opt.label}
        >
          <MiniPreview config={{ ...previewBase, headwear: opt.id }} />
        </OptionCard>
      ))}
    </div>
  )
}

export default function AvatarBuilder({
  value,
  onChange,
  onSave,
  saving = false,
  saveLabel = 'Save Avatar',
  variant = 'admin',
  showSaveButton = true,
}: AvatarBuilderProps) {
  const [tab, setTab] = useState<AvatarBuilderTab>('base')
  const accent = variant === 'admin' ? GOLD : '#F5A623'

  const normalized = useMemo(() => normalizeConfigForBase(value), [value])

  const patch = (partial: Partial<AvatarConfig>) => {
    onChange(normalizeConfigForBase({ ...value, ...partial }))
  }

  const setBase = (base: AvatarConfig['base']) => {
    const category = normalized.headwear.startsWith('hijab')
      ? 'hijab'
      : normalized.headwear.startsWith('kufi')
        ? 'kufi'
        : 'hair'
    const valid = getHeadwearForCategory(category, base).some((h) => h.id === normalized.headwear)
    patch({ base, headwear: valid ? normalized.headwear : getDefaultHeadwearForBase(base) })
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'base':
        return (
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {AVATAR_BASE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={normalized.base === opt.id}
                onClick={() => setBase(opt.id)}
                label={opt.label}
              >
                <MiniPreview
                  config={{ ...normalized, base: opt.id, headwear: getDefaultHeadwearForBase(opt.id) }}
                />
              </OptionCard>
            ))}
          </div>
        )
      case 'hijab':
        return (
          <HeadwearGrid
            category="hijab"
            base={normalized.base}
            value={normalized.headwear}
            previewBase={normalized}
            onSelect={(headwear) => patch({ headwear })}
          />
        )
      case 'hair':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3 m-0" style={{ color: TEAL }}>
                Hair Styles
              </p>
              <HeadwearGrid
                category="hair"
                base={normalized.base}
                value={normalized.headwear}
                previewBase={normalized}
                onSelect={(headwear) => patch({ headwear })}
              />
            </div>
            {normalized.base === 'boy' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-3 m-0" style={{ color: TEAL }}>
                  Kufi
                </p>
                <HeadwearGrid
                  category="kufi"
                  base={normalized.base}
                  value={normalized.headwear}
                  previewBase={normalized}
                  onSelect={(headwear) => patch({ headwear })}
                />
              </div>
            )}
          </div>
        )
      case 'accessory':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACCESSORY_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={normalized.accessory === opt.id}
                onClick={() => patch({ accessory: opt.id })}
                label={opt.label}
              >
                <MiniPreview config={{ ...normalized, accessory: opt.id }} />
              </OptionCard>
            ))}
          </div>
        )
      case 'background':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BACKGROUND_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={normalized.background === opt.id}
                onClick={() => patch({ background: opt.id })}
                label={opt.label}
              >
                <MiniPreview config={{ ...normalized, background: opt.id }} />
              </OptionCard>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div
        className="flex flex-col items-center gap-4 p-6 rounded-3xl shrink-0 lg:w-[260px]"
        style={{
          background: 'linear-gradient(165deg, #FFFCF7 0%, #F5EFE4 100%)',
          border: '1px solid #EDE8DF',
        }}
      >
        <div
          className="rounded-full p-1"
          style={{
            background: '#fff',
            boxShadow: '0 12px 40px rgba(9,38,74,0.1)',
            border: `3px solid ${accent}`,
          }}
        >
          <AvatarPreview config={normalized} size={188} />
        </div>
        <p className="text-xs font-bold m-0 tracking-wide uppercase" style={{ color: TEAL, letterSpacing: '0.06em' }}>
          Live preview
        </p>
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => onChange(randomizeAvatarConfig())}
            className="flex-1 py-2 rounded-full text-xs font-bold border cursor-pointer bg-white/80 hover:bg-white transition-colors"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Randomize
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_AVATAR_CONFIG })}
            className="flex-1 py-2 rounded-full text-xs font-bold border cursor-pointer bg-white/80 hover:bg-white transition-colors"
            style={{ borderColor: '#EDE8DF', color: NAVY }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {AVATAR_BUILDER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border cursor-pointer shrink-0 transition-colors"
              style={
                tab === t.id
                  ? { background: accent, color: '#fff', borderColor: accent }
                  : { background: '#fff', color: NAVY, borderColor: '#EDE8DF' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="p-4 rounded-2xl min-h-[240px]"
          style={{ background: '#FFFCF7', border: '1px solid #EDE8DF' }}
        >
          {renderTabContent()}
        </div>

        {showSaveButton && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="px-8 py-2.5 rounded-full text-sm font-bold border-0 cursor-pointer disabled:opacity-60"
            style={{ background: accent, color: '#fff' }}
          >
            {saving ? 'Saving…' : saveLabel}
          </button>
        )}
      </div>
    </div>
  )
}
