import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { LEARNING_PATHS } from '@/lib/learningPaths'
import { GAMES, gameHref } from '@/lib/games'
import { appHomePath, PUBLIC_HOME_PATH } from '@/lib/navigation'
import { childNavPaths } from '@/lib/navLinks'
import UserAvatar from '@/components/UserAvatar'
import BrandLogo from '@/components/BrandLogo'

const NAVBAR_HEIGHT_PX = 64
const NAVBAR_LOGO_HEIGHT_PX = NAVBAR_HEIGHT_PX - 6

export default function Navbar() {
  const navigate = useNavigate()
  const { selectedChild: activeChild, clearActiveChild, children: childProfiles, loading: childrenLoading } = useSelectedChild()
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null)
  const [pathsOpen, setPathsOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [mobilePathsOpen, setMobilePathsOpen] = useState(false)
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathsRef = useRef<HTMLDivElement>(null)
  const gamesRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!pathsOpen && !gamesOpen && !avatarOpen) return

    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (pathsRef.current && !pathsRef.current.contains(target)) setPathsOpen(false)
      if (gamesRef.current && !gamesRef.current.contains(target)) setGamesOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(target)) setAvatarOpen(false)
    }

    const timer = window.setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [pathsOpen, gamesOpen, avatarOpen])

  const handleSignOut = async () => {
    clearActiveChild()
    await supabase.auth.signOut()
    navigate(PUBLIC_HOME_PATH)
  }

  const navLink = {
    fontFamily: 'Nunito, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1B2F5E',
    textDecoration: 'none',
    padding: '0 12px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  } as const

  const pathsDropdownPanelStyle = {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    minWidth: '340px',
    padding: '8px',
  }

  const pathsDropdownShellStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    paddingTop: '4px',
    zIndex: 1100,
  }

  const pathDropItem = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
  }

  const renderPathsDropdown = (onNavigate: () => void) => (
    <div style={pathsDropdownPanelStyle}>
      {LEARNING_PATHS.map((p) => (
        <Link
          key={p.slug}
          to={`/paths/${p.slug}`}
          style={pathDropItem}
          onClick={onNavigate}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
          <div>
            <div
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: p.color,
                marginBottom: '2px',
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                color: '#6B7280',
                lineHeight: 1.4,
              }}
            >
              {p.description}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  const renderGamesDropdown = (onNavigate: () => void) => (
    <div style={{ ...pathsDropdownPanelStyle, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
      {GAMES.map((game) => (
        <Link
          key={game.slug}
          to={gameHref(game)}
          style={pathDropItem}
          onClick={onNavigate}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{game.icon}</span>
          <div>
            <div
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1B2F5E',
                marginBottom: '2px',
              }}
            >
              {game.name}
            </div>
            <div
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                color: '#6B7280',
                lineHeight: 1.4,
              }}
            >
              {game.description}
            </div>
          </div>
        </Link>
      ))}
      <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 8px' }} />
      <Link
        to="/games"
        style={{
          ...pathDropItem,
          justifyContent: 'center',
          color: '#2AAFA0',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
        }}
        onClick={onNavigate}
      >
        View All Games →
      </Link>
    </div>
  )

  const renderGamesNavButton = (onNavigate: () => void) => (
    <div
      ref={gamesRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setGamesOpen(true)}
      onMouseLeave={() => setGamesOpen(false)}
    >
      <button
        type="button"
        style={{ ...navLink, display: 'flex', alignItems: 'center', gap: '4px' }}
        onClick={() => setGamesOpen(true)}
        aria-expanded={gamesOpen}
        aria-haspopup="true"
      >
        Games <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      {gamesOpen && (
        <div style={pathsDropdownShellStyle}>{renderGamesDropdown(onNavigate)}</div>
      )}
    </div>
  )

  const renderPathsNavButton = (onNavigate: () => void) => (
    <div
      ref={pathsRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setPathsOpen(true)}
      onMouseLeave={() => setPathsOpen(false)}
    >
      <button
        type="button"
        style={{ ...navLink, display: 'flex', alignItems: 'center', gap: '4px' }}
        onClick={() => setPathsOpen(true)}
        aria-expanded={pathsOpen}
        aria-haspopup="true"
      >
        Learning Paths <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      {pathsOpen && (
        <div style={pathsDropdownShellStyle}>{renderPathsDropdown(onNavigate)}</div>
      )}
    </div>
  )

  const dropdownPanelStyle = {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    minWidth: '240px',
    padding: '8px 0',
  }

  const dropItem = {
    display: 'block',
    padding: '10px 16px',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1B2F5E',
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
  }

  const sectionLabel = {
    display: 'block',
    padding: '8px 16px 4px',
    fontSize: '10px',
    fontWeight: 800,
    color: '#9CA3AF',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const divider = <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />

  const renderMobilePathsSection = () => (
    <>
      <button
        type="button"
        style={{ ...dropItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setMobilePathsOpen((o) => !o)}
      >
        <span>Learning Paths</span>
        <span style={{ fontSize: '10px' }}>{mobilePathsOpen ? '▲' : '▼'}</span>
      </button>
      {mobilePathsOpen &&
        LEARNING_PATHS.map((p) => (
          <Link
            key={p.slug}
            to={`/paths/${p.slug}`}
            style={{ ...pathDropItem, paddingLeft: '20px' }}
            onClick={() => {
              setMobileOpen(false)
              setMobilePathsOpen(false)
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: p.color }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{p.description}</div>
            </div>
          </Link>
        ))}
    </>
  )

  const renderMobileGamesSection = () => (
    <>
      <button
        type="button"
        style={{ ...dropItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setMobileGamesOpen((o) => !o)}
      >
        <span>Games</span>
        <span style={{ fontSize: '10px' }}>{mobileGamesOpen ? '▲' : '▼'}</span>
      </button>
      {mobileGamesOpen &&
        GAMES.map((game) => (
          <Link
            key={game.slug}
            to={gameHref(game)}
            style={{ ...pathDropItem, paddingLeft: '20px' }}
            onClick={() => {
              setMobileOpen(false)
              setMobileGamesOpen(false)
            }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{game.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B2F5E' }}>{game.name}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{game.description}</div>
            </div>
          </Link>
        ))}
      {mobileGamesOpen && (
        <Link
          to="/games"
          style={{ ...dropItem, paddingLeft: '20px', color: '#2AAFA0', fontSize: '13px' }}
          onClick={() => {
            setMobileOpen(false)
            setMobileGamesOpen(false)
          }}
        >
          View All Games →
        </Link>
      )}
    </>
  )

  /** Child shown in the profile control — active selection, or sole child on the account. */
  const profileChild =
    activeChild ?? (childProfiles.length === 1 ? childProfiles[0] : null)

  const profileAgeColor =
    profileChild?.age_group === 'explorer'
      ? '#F5A623'
      : profileChild?.age_group === 'discoverer'
        ? '#2AAFA0'
        : '#8B6BB1'

  const renderProfileDropdown = (child: typeof profileChild) => (
    <div ref={avatarRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAvatarOpen((o) => !o)}
        aria-expanded={avatarOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '999px',
        }}
      >
        {child ? (
          <>
            <UserAvatar
              name={child.name}
              avatarId={child.avatar_id ?? null}
              avatarConfig={child.avatar_config}
              size={36}
              variant="header"
            />
            <span style={{ fontFamily: 'Nunito', fontSize: '14px', fontWeight: 700, color: '#1B2F5E' }}>
              {child.name}
            </span>
          </>
        ) : (
          <>
            <UserAvatar name="Parent" avatarId={null} size={36} variant="header" />
            <span style={{ fontFamily: 'Nunito', fontSize: '14px', fontWeight: 700, color: '#1B2F5E' }}>
              {childProfiles.length > 1 ? 'Select child' : 'My account'}
            </span>
          </>
        )}
        <span style={{ fontSize: '10px', color: '#6B7280' }}>▼</span>
      </button>

      {avatarOpen && (
        <div style={{ ...pathsDropdownShellStyle, left: 'auto', right: 0 }}>
          <div style={{ ...dropdownPanelStyle, minWidth: '260px' }}>
            {child && (
              <>
                <div style={{ padding: '12px 16px' }}>
                  <div
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1B2F5E',
                    }}
                  >
                    {child.name}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      background: profileAgeColor,
                      color: '#fff',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  >
                    {child.age_group}
                  </span>
                  {user?.email && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#6B7280',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      Parent: {user.email}
                    </div>
                  )}
                </div>
                {divider}
              </>
            )}

            {child && (
              <>
                <Link to="/profile" style={dropItem} onClick={() => setAvatarOpen(false)}>
                  My Profile
                </Link>
                <Link to={childNavPaths(child).profileAvatar} style={dropItem} onClick={() => setAvatarOpen(false)}>
                  Choose Avatar
                </Link>
              </>
            )}

            {childProfiles.length > 1 && (
              <Link to="/children?pick=1" style={dropItem} onClick={() => setAvatarOpen(false)}>
                Switch child
              </Link>
            )}

            <div style={{ padding: '4px 16px 8px' }}>
              <button
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #2AAFA0',
                  color: '#2AAFA0',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 800,
                  fontSize: '13px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'none',
                }}
                onClick={() => {
                  setAvatarOpen(false)
                  navigate('/children/new')
                }}
              >
                + Add child
              </button>
            </div>

            {child && (
              <>
                <Link to="/achievements" style={dropItem} onClick={() => setAvatarOpen(false)}>
                  Achievements
                </Link>
                <Link to="/certificates" style={dropItem} onClick={() => setAvatarOpen(false)}>
                  Certificates
                </Link>
                {divider}
              </>
            )}

            <span style={sectionLabel}>🔒 Parent Area</span>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent')
              }}
            >
              Parent Dashboard
            </button>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent/progress')
              }}
            >
              Child Progress
            </button>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent/messages')
              }}
            >
              Messages & Announcements
            </button>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent/subscription')
              }}
            >
              Subscription 🔒
            </button>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent/settings')
              }}
            >
              Settings 🔒
            </button>
            <button
              style={{ ...dropItem, color: '#6B7280' }}
              onClick={() => {
                setAvatarOpen(false)
                navigate('/parent/support')
              }}
            >
              Support
            </button>
            {divider}

            <button style={{ ...dropItem, color: '#E85D4A' }} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          height: `${NAVBAR_HEIGHT_PX}px`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          justifyContent: 'space-between',
          overflow: 'visible',
        }}
      >
        <BrandLogo to={appHomePath(Boolean(profileChild))} height={NAVBAR_LOGO_HEIGHT_PX} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hide-mobile">
          {!user ? (
            <>
              {renderGamesNavButton(() => setGamesOpen(false))}
              {renderPathsNavButton(() => setPathsOpen(false))}
              <Link to="/pricing" style={navLink}>
                Subscription
              </Link>
              <Link to="/about" style={navLink}>
                About
              </Link>
            </>
          ) : profileChild ? (
            <>
              <Link to="/home" style={navLink}>
                Home
              </Link>

              {renderPathsNavButton(() => setPathsOpen(false))}

              {renderGamesNavButton(() => setGamesOpen(false))}

              <Link to="/journey" style={navLink}>
                My Journey
              </Link>

              <button style={{ ...navLink, fontSize: '18px' }} onClick={() => navigate('/search')}>
                🔍
              </button>
            </>
          ) : (
            <>
              {renderGamesNavButton(() => setGamesOpen(false))}
              {renderPathsNavButton(() => setPathsOpen(false))}
              <Link to="/pricing" style={navLink}>
                Subscription
              </Link>
              <Link to="/about" style={navLink}>
                About
              </Link>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!user ? (
            <>
              <Link
                to="/login"
                style={{
                  ...navLink,
                  border: '1.5px solid #1B2F5E',
                  borderRadius: '999px',
                  padding: '7px 18px',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                style={{
                  background: '#F5A623',
                  color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '8px 20px',
                  textDecoration: 'none',
                }}
              >
                Start Free →
              </Link>
            </>
          ) : childrenLoading ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '999px',
                background: '#EEF4FF',
              }}
              aria-hidden
            />
          ) : (
            renderProfileDropdown(profileChild)
          )}

          <button
            className="show-mobile"
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#1B2F5E',
              marginLeft: '8px',
            }}
          >
            ☰
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '280px',
              background: '#fff',
              padding: '20px 0',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 16px 16px',
              }}
            >
              {profileChild ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserAvatar
                    name={profileChild.name}
                    avatarId={profileChild.avatar_id ?? null}
                    avatarConfig={profileChild.avatar_config}
                    size={36}
                    variant="header"
                  />
                  <span style={{ fontWeight: 700, color: '#1B2F5E' }}>{profileChild.name}</span>
                </div>
              ) : user ? (
                <span style={{ fontWeight: 700, color: '#1B2F5E' }}>
                  {childProfiles.length > 1 ? 'Select child' : 'My account'}
                </span>
              ) : null}
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {divider}

            {!user ? (
              <>
                {renderMobileGamesSection()}
                {renderMobilePathsSection()}
                <Link to="/pricing" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Subscription
                </Link>
                <Link to="/about" style={dropItem} onClick={() => setMobileOpen(false)}>
                  About
                </Link>
                {divider}
                <Link to="/login" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" style={{ ...dropItem, color: '#F5A623' }} onClick={() => setMobileOpen(false)}>
                  Start Free →
                </Link>
              </>
            ) : (
              <>
                {profileChild && (
                  <>
                    <Link to="/home" style={dropItem} onClick={() => setMobileOpen(false)}>
                      Home
                    </Link>
                    <Link to="/journey" style={dropItem} onClick={() => setMobileOpen(false)}>
                      My Journey
                    </Link>
                    <Link to="/search" style={dropItem} onClick={() => setMobileOpen(false)}>
                      Search
                    </Link>
                    <Link to="/profile" style={dropItem} onClick={() => setMobileOpen(false)}>
                      My Profile
                    </Link>
                    {divider}
                  </>
                )}
                {renderMobileGamesSection()}
                {renderMobilePathsSection()}
                {profileChild && (
                  <>
                    {divider}
                    <Link to="/achievements" style={dropItem} onClick={() => setMobileOpen(false)}>
                      Achievements
                    </Link>
                    <Link to="/certificates" style={dropItem} onClick={() => setMobileOpen(false)}>
                      Certificates
                    </Link>
                  </>
                )}
                {divider}
                <span style={sectionLabel}>🔒 Parent Area</span>
                <Link to="/parent" style={{ ...dropItem, color: '#6B7280' }} onClick={() => setMobileOpen(false)}>
                  Parent Dashboard
                </Link>
                <Link
                  to="/parent/subscription"
                  style={{ ...dropItem, color: '#6B7280' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Subscription
                </Link>
                <Link
                  to="/parent/settings"
                  style={{ ...dropItem, color: '#6B7280' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
                {divider}
                {childProfiles.length > 1 && (
                  <Link to="/children?pick=1" style={dropItem} onClick={() => setMobileOpen(false)}>
                    Switch child
                  </Link>
                )}
                <button
                  type="button"
                  style={{ ...dropItem, color: '#2AAFA0', fontWeight: 800 }}
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/children/new')
                  }}
                >
                  + Add child
                </button>
                <button style={{ ...dropItem, color: '#E85D4A' }} onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .hide-mobile { display: none !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
        a:hover, button:hover { opacity: 0.8; }
      `}</style>
    </>
  )
}
