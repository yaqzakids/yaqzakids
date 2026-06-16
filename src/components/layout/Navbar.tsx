import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSelectedChild } from '@/context/SelectedChildContext'

const PATHS = [
  { name: 'Foundations of Faith', slug: 'foundations-of-faith' },
  { name: 'Science & Nature', slug: 'science-nature' },
  { name: 'History & Civilization', slug: 'history-civilization' },
  { name: 'Geography & Cultures', slug: 'geography-cultures' },
  { name: 'Technology & AI', slug: 'technology-ai' },
  { name: "Today's World", slug: 'todays-world' },
  { name: 'Environment & Stewardship', slug: 'environment-stewardship' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { selectedChild: activeChild, clearActiveChild } = useSelectedChild()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const exploreRef = useRef<HTMLDivElement>(null)
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
    function handleClick(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    clearActiveChild()
    await supabase.auth.signOut()
    navigate('/')
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

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    minWidth: '240px',
    padding: '8px 0',
    zIndex: 1000,
    marginTop: '8px',
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

  const getInitial = (name: string) => name?.[0]?.toUpperCase() ?? '?'

  const ageColor =
    activeChild?.age_group === 'explorer'
      ? '#F5A623'
      : activeChild?.age_group === 'discoverer'
        ? '#2AAFA0'
        : '#8B6BB1'

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="https://i.ibb.co/Z1KtZ2rN/Chat-GPT-Image-Jun-2-2026-08-37-45-PM.png"
            alt="Yaqza Kids"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hide-mobile">
          {!user ? (
            <>
              <Link to="/discover" style={navLink}>
                Discover
              </Link>
              <Link to="/paths" style={navLink}>
                Learning Paths
              </Link>
              <Link to="/pricing" style={navLink}>
                Pricing
              </Link>
              <Link to="/about" style={navLink}>
                About
              </Link>
            </>
          ) : activeChild ? (
            <>
              <Link to="/home" style={navLink}>
                Home
              </Link>

              <div ref={exploreRef} style={{ position: 'relative' }}>
                <button
                  style={{ ...navLink, display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setExploreOpen((o) => !o)}
                >
                  Explore <span style={{ fontSize: '10px' }}>▼</span>
                </button>
                {exploreOpen && (
                  <div style={dropdownStyle}>
                    <span style={sectionLabel}>Learning Paths</span>
                    {PATHS.map((p) => (
                      <Link
                        key={p.slug}
                        to={`/paths/${p.slug}`}
                        style={dropItem}
                        onClick={() => setExploreOpen(false)}
                      >
                        {p.name}
                      </Link>
                    ))}
                    {divider}
                    <span style={sectionLabel}>Discover</span>
                    <Link to="/discover/featured" style={dropItem} onClick={() => setExploreOpen(false)}>
                      Featured Stories
                    </Link>
                    <Link to="/discover/new" style={dropItem} onClick={() => setExploreOpen(false)}>
                      New This Week
                    </Link>
                    <Link to="/discover/popular" style={dropItem} onClick={() => setExploreOpen(false)}>
                      Most Popular
                    </Link>
                    <Link to="/discover/recommended" style={dropItem} onClick={() => setExploreOpen(false)}>
                      Recommended for You
                    </Link>
                    {divider}
                    <span style={sectionLabel}>My Progress</span>
                    <Link to="/achievements" style={dropItem} onClick={() => setExploreOpen(false)}>
                      Achievements
                    </Link>
                    <Link to="/certificates" style={dropItem} onClick={() => setExploreOpen(false)}>
                      Certificates
                    </Link>
                    <Link to="/journey" style={dropItem} onClick={() => setExploreOpen(false)}>
                      My Journey
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/journey" style={navLink}>
                My Journey
              </Link>

              <button style={{ ...navLink, fontSize: '18px' }} onClick={() => navigate('/search')}>
                🔍
              </button>
            </>
          ) : (
            <>
              <Link to="/discover" style={navLink}>
                Discover
              </Link>
              <Link to="/paths" style={navLink}>
                Learning Paths
              </Link>
              <Link to="/pricing" style={navLink}>
                Pricing
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
          ) : activeChild ? (
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAvatarOpen((o) => !o)}
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
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: ageColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '15px',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  {getInitial(activeChild.name)}
                </div>
                <span style={{ fontFamily: 'Nunito', fontSize: '14px', fontWeight: 700, color: '#1B2F5E' }}>
                  {activeChild.name}
                </span>
                <span style={{ fontSize: '10px', color: '#6B7280' }}>▼</span>
              </button>

              {avatarOpen && (
                <div style={{ ...dropdownStyle, left: 'auto', right: 0, minWidth: '260px' }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1B2F5E',
                      }}
                    >
                      {activeChild.name}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        background: ageColor,
                        color: '#fff',
                        borderRadius: '999px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {activeChild.age_group}
                    </span>
                  </div>
                  {divider}

                  <Link to="/profile" style={dropItem} onClick={() => setAvatarOpen(false)}>
                    My Profile
                  </Link>
                  <Link to="/profile/avatar" style={dropItem} onClick={() => setAvatarOpen(false)}>
                    Choose Avatar
                  </Link>
                  <Link to="/children" style={dropItem} onClick={() => setAvatarOpen(false)}>
                    Switch Child
                  </Link>
                  <Link to="/achievements" style={dropItem} onClick={() => setAvatarOpen(false)}>
                    Achievements
                  </Link>
                  <Link to="/certificates" style={dropItem} onClick={() => setAvatarOpen(false)}>
                    Certificates
                  </Link>
                  {divider}

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
              )}
            </div>
          ) : (
            <>
              <Link
                to="/children"
                style={{
                  ...navLink,
                  border: '1.5px solid #F5A623',
                  borderRadius: '999px',
                  padding: '7px 18px',
                  color: '#F5A623',
                }}
              >
                Select Child
              </Link>
              <button style={{ ...navLink, color: '#E85D4A' }} onClick={handleSignOut}>
                Sign Out
              </button>
            </>
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
              {activeChild && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: ageColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    {getInitial(activeChild.name)}
                  </div>
                  <span style={{ fontWeight: 700, color: '#1B2F5E' }}>{activeChild.name}</span>
                </div>
              )}
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
                <Link to="/discover" style={{ ...dropItem }} onClick={() => setMobileOpen(false)}>
                  Discover
                </Link>
                <Link to="/paths" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Learning Paths
                </Link>
                <Link to="/pricing" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Pricing
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
            ) : activeChild ? (
              <>
                <Link to="/home" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
                <Link to="/journey" style={dropItem} onClick={() => setMobileOpen(false)}>
                  My Journey
                </Link>
                <Link to="/achievements" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Achievements
                </Link>
                <Link to="/search" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Search
                </Link>
                {divider}
                <span style={sectionLabel}>Learning Paths</span>
                {PATHS.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/paths/${p.slug}`}
                    style={{ ...dropItem, paddingLeft: '24px', fontSize: '13px' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {p.name}
                  </Link>
                ))}
                {divider}
                <span style={sectionLabel}>Discover</span>
                <Link
                  to="/discover/featured"
                  style={{ ...dropItem, paddingLeft: '24px', fontSize: '13px' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Featured Stories
                </Link>
                <Link
                  to="/discover/new"
                  style={{ ...dropItem, paddingLeft: '24px', fontSize: '13px' }}
                  onClick={() => setMobileOpen(false)}
                >
                  New This Week
                </Link>
                <Link
                  to="/discover/popular"
                  style={{ ...dropItem, paddingLeft: '24px', fontSize: '13px' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Most Popular
                </Link>
                <Link
                  to="/discover/recommended"
                  style={{ ...dropItem, paddingLeft: '24px', fontSize: '13px' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Recommended for You
                </Link>
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
                <Link to="/children" style={dropItem} onClick={() => setMobileOpen(false)}>
                  Switch Child
                </Link>
                <button style={{ ...dropItem, color: '#E85D4A' }} onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/children" style={{ ...dropItem, color: '#F5A623' }} onClick={() => setMobileOpen(false)}>
                  Select Child
                </Link>
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
