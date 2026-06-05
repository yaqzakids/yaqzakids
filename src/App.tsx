import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { STORAGE_KEYS } from './lib/constants'
import Welcome from './pages/Welcome'
import Explorer from './pages/Explorer'
import Discoverer from './pages/Discoverer'
import Thinker from './pages/Thinker'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ChildDashboard from './pages/ChildDashboard'
import ArticleReader from './pages/ArticleReader'
import About from './pages/About'
import PricingPage from './pages/Pricing'

function HomeRedirect() {
  const ageGroup = localStorage.getItem(STORAGE_KEYS.ageGroup)
  if (!ageGroup) return <Navigate to="/welcome" replace />
  if (ageGroup === 'explorer') return <Explorer />
  if (ageGroup === 'discoverer') return <Discoverer />
  if (ageGroup === 'thinker') return <Thinker />
  return <Navigate to="/welcome" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/discoverer" element={<Discoverer />} />
        <Route path="/thinker" element={<Thinker />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/article/:id" element={<ArticleReader />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/child-dashboard" element={<ProtectedRoute><ChildDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
