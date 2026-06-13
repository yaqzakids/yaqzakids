export const adminColors = {
  navy: '#1B2F5E',
  gold: '#F5A623',
  bg: '#F8FAFC',
  white: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  success: '#166534',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
} as const

export const adminBtn = {
  primary: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: adminColors.gold,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  } as const,
  secondary: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: adminColors.text,
    background: adminColors.white,
    border: `1px solid ${adminColors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
  } as const,
  danger: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: adminColors.danger,
    background: adminColors.white,
    border: `1px solid ${adminColors.danger}`,
    borderRadius: 6,
    cursor: 'pointer',
  } as const,
}

export const adminInput = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: `1px solid ${adminColors.border}`,
  borderRadius: 6,
  boxSizing: 'border-box' as const,
}

export const adminTextarea = {
  ...adminInput,
  minHeight: 120,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
  lineHeight: 1.5,
}

export const adminTableTh = {
  textAlign: 'left' as const,
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: adminColors.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  borderBottom: `1px solid ${adminColors.border}`,
  whiteSpace: 'nowrap' as const,
}

export const adminTableTd = {
  padding: '12px',
  fontSize: 14,
  borderBottom: `1px solid #f3f4f6`,
  verticalAlign: 'middle' as const,
}

export const adminCard = {
  background: adminColors.white,
  border: `1px solid ${adminColors.border}`,
  borderRadius: 8,
  padding: 24,
}
