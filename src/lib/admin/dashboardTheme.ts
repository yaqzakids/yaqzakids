export const dashboardTheme = {
  sidebar: '#09264A',
  sidebarHover: 'rgba(255,255,255,0.08)',
  sidebarActive: '#F5A623',
  sidebarActiveText: '#09264A',
  navy: '#1B2F5E',
  gold: '#F5A623',
  teal: '#2AAFA0',
  cream: '#FAF8F2',
  white: '#FFFFFF',
  border: '#E8E4DC',
  muted: '#6B7280',
  text: '#1B2F5E',
  shadow: '0 4px 24px rgba(9, 38, 74, 0.06)',
  shadowSm: '0 2px 12px rgba(9, 38, 74, 0.05)',
} as const

export const dashboardCard = {
  background: dashboardTheme.white,
  borderRadius: 16,
  border: `1px solid ${dashboardTheme.border}`,
  boxShadow: dashboardTheme.shadowSm,
  padding: 24,
} as const

export const kpiAccents = {
  parents: { bg: '#EEF4FF', icon: '👨‍👩‍👧', color: '#3B5BDB' },
  children: { bg: '#FFF4E6', icon: '👶', color: '#F5A623' },
  subscribers: { bg: '#E6F7F5', icon: '⭐', color: '#2AAFA0' },
  free: { bg: '#F3F0FF', icon: '🎁', color: '#7C5CFC' },
  articles: { bg: '#FFF0F0', icon: '📝', color: '#E03131' },
  published: { bg: '#E8F5E9', icon: '✅', color: '#2F9E44' },
  quizzes: { bg: '#FFF9DB', icon: '❓', color: '#E67700' },
} as const
