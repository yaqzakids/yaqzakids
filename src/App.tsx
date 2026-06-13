import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { VoiceSettingsProvider } from './context/VoiceSettingsContext'
import AdventureChildGuard from './components/adventure/AdventureChildGuard'
import AdventurePathAccessGate from './components/adventure/AdventurePathAccessGate'
import AdventureArticleAccessGate from './components/adventure/AdventureArticleAccessGate'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import { STORAGE_KEYS } from './lib/constants'
import Welcome from './pages/Welcome'
import Explorer from './pages/Explorer'
import Discoverer from './pages/Discoverer'
import DiscovererDashboard from './pages/dashboard/DiscovererDashboard'
import DailyMission from './pages/DailyMission'
import BadgesPage from './pages/BadgesPage'
import CertificatesPage from './pages/CertificatesPage'
import ExplorePage from './pages/discoverer/ExplorePage'
import LibraryPage from './pages/discoverer/LibraryPage'
import Thinker from './pages/Thinker'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ChildDashboard from './pages/ChildDashboard'
import ArticleReader from './pages/ArticleReader'
import About from './pages/About'
import PricingPage from './pages/Pricing'
import AdventurePathsPage from './pages/AdventurePathsPage'
import AdventurePathDetailPage from './pages/AdventurePathDetailPage'
import AdventureArticlePage from './pages/AdventureArticlePage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminContentPage from './pages/admin/AdminContentPage'
import AdminAdventuresPage from './pages/admin/AdminAdventuresPage'
import AdminFamiliesPage from './pages/admin/AdminFamiliesPage'
import AdminPayments from './pages/admin/AdminPayments'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminLogPage from './pages/admin/AdminLogPage'
import AdminComingSoonPage from './pages/admin/AdminComingSoonPage'
import AdminQuizzesPage from './pages/admin/AdminQuizzesPage'
import AdminQuizEditorPage from './pages/admin/AdminQuizEditorPage'
import AdminArticlesPage from './pages/admin/AdminArticlesPage'
import AdminArticleEditorPage from './pages/admin/AdminArticleEditorPage'
import AdminPathsPage from './pages/admin/AdminPathsPage'
import AdminPathEditorPage from './pages/admin/AdminPathEditorPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminChildrenPage from './pages/admin/AdminChildrenPage'
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage'
import AdminDiscounts from './pages/admin/AdminDiscounts'
import AdminRefunds from './pages/admin/AdminRefunds'
import AdminProgressPage from './pages/admin/AdminProgressPage'
import AdminProfileSettingsPage from './pages/admin/AdminProfileSettingsPage'
import SupportPage from './pages/SupportPage'
import MessagesPage from './pages/MessagesPage'
import AdminMessagesPage from './pages/admin/AdminMessagesPage'
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage'

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
      <SelectedChildProvider>
        <VoiceSettingsProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/discoverer" element={<Discoverer />} />
          <Route path="/discoverer/dashboard" element={<ProtectedRoute><DiscovererDashboard /></ProtectedRoute>} />
          <Route path="/discoverer/mission" element={<ProtectedRoute><DailyMission /></ProtectedRoute>} />
          <Route path="/discoverer/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
          <Route path="/discoverer/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
          <Route path="/discoverer/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/discoverer/explore" element={<ExplorePage />} />
          <Route path="/thinker" element={<Thinker />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/adventures" element={<AdventurePathsPage />} />
          <Route
            path="/adventures/:pathSlug"
            element={
              <ProtectedRoute>
                <AdventureChildGuard>
                  <AdventurePathAccessGate>
                    <AdventurePathDetailPage />
                  </AdventurePathAccessGate>
                </AdventureChildGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/adventures/:pathSlug/:articleSlug"
            element={
              <ProtectedRoute>
                <AdventureChildGuard>
                  <AdventureArticleAccessGate>
                    <AdventureArticlePage />
                  </AdventureArticleAccessGate>
                </AdventureChildGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/article/:id" element={<ArticleReader />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/child-dashboard" element={<ProtectedRoute><ChildDashboard /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="adventures" element={<AdminAdventuresPage />} />
              <Route path="families" element={<AdminFamiliesPage />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="settings/profile" element={<AdminProfileSettingsPage />} />
              <Route path="log" element={<AdminLogPage />} />
              <Route path="quizzes" element={<AdminQuizzesPage />} />
              <Route path="quizzes/:articleId" element={<AdminQuizEditorPage />} />
              <Route path="progress" element={<AdminProgressPage />} />
              <Route path="refunds" element={<AdminRefunds />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route
                path="roles"
                element={
                  <AdminComingSoonPage
                    title="Admin Roles"
                    description="Manage admin team members and assign roles (owner, content editor, support agent, finance admin, viewer)."
                    backTo={{ label: 'Settings', path: '/admin/settings' }}
                  />
                }
              />
              {/* Legacy direct routes preserved */}
              <Route path="articles" element={<AdminArticlesPage />} />
              <Route path="articles/new" element={<AdminArticleEditorPage />} />
              <Route path="articles/:id" element={<AdminArticleEditorPage />} />
              <Route path="paths" element={<AdminPathsPage />} />
              <Route path="paths/new" element={<AdminPathEditorPage />} />
              <Route path="paths/:id" element={<AdminPathEditorPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="children" element={<AdminChildrenPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="discounts" element={<AdminDiscounts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </VoiceSettingsProvider>
      </SelectedChildProvider>
    </BrowserRouter>
  )
}
