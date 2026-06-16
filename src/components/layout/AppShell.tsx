import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { shouldShowGlobalNavbar } from '@/lib/navLinks'

export default function AppShell() {
  const { pathname } = useLocation()
  const showNav = shouldShowGlobalNavbar(pathname)

  return (
    <>
      {showNav && <Navbar />}
      <Outlet />
    </>
  )
}
