import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { ParentGateProvider } from './context/ParentGateContext'
import ParentGateRoute from './components/parent/ParentGateRoute'
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
import ActiveChildGuard from './components/ActiveChildGuard'
import ChildrenPage from './pages/ChildrenPage'
import ChildProfileFormPage from './pages/children/ChildProfileFormPage'
import DiscovererDashboard from './pages/dashboard/DiscovererDashboard'
import ExplorerDashboard from './pages/dashboard/ExplorerDashboard'
import ThinkerDashboard from './pages/dashboard/ThinkerDashboard'
import DailyMission from './pages/DailyMission'
import BadgesPage from './pages/BadgesPage'
import CertificatesPage from './pages/CertificatesPage'
import ExplorePage from './pages/discoverer/ExplorePage'
import LibraryPage from './pages/discoverer/LibraryPage'
import SampleStoriesPage from './pages/SampleStoriesPage'
import PathsPage from './pages/PathsPage'
import ParentsPage from './pages/ParentsPage'
import JourneyPage from './pages/discoverer/JourneyPage'
import ProfilePage from './pages/discoverer/ProfilePage'
import StreaksPage from './pages/discoverer/StreaksPage'
import RewardsPage from './pages/discoverer/RewardsPage'
import DiscovererArticleShortLink from './pages/discoverer/DiscovererArticleShortLink'
import Thinker from './pages/Thinker'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ParentAccountSettingsPage from './pages/ParentAccountSettingsPage'
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
import AdminAdminUsersPage from './pages/admin/AdminAdminUsersPage'
import AdminLogPage from './pages/admin/AdminLogPage'
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
  if (ageGroup === 'explorer') return <Navigate to="/explorer" replace />
  if (ageGroup === 'discoverer') return <Navigate to="/discoverer" replace />
  if (ageGroup === 'thinker') return <Navigate to="/thinker" replace />
  return <Navigate to="/welcome" replace />
}

function ParentRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ParentGateRoute>{children}</ParentGateRoute>
    </ProtectedRoute>
  )
}

function ChildExperienceRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ActiveChildGuard>{children}</ActiveChildGuard>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SelectedChildProvider>
        <ParentGateProvider>
        <VoiceSettingsProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/discoverer" element={<Discoverer />} />
          <Route path="/children" element={<ProtectedRoute><ChildrenPage /></ProtectedRoute>} />
          <Route path="/children/new" element={<ProtectedRoute><ChildProfileFormPage /></ProtectedRoute>} />
          <Route path="/children/:childProfileId/edit" element={<ProtectedRoute><ChildProfileFormPage /></ProtectedRoute>} />
          <Route path="/explorer/dashboard" element={<ChildExperienceRoute><ExplorerDashboard /></ChildExperienceRoute>} />
          <Route path="/discoverer/dashboard" element={<ChildExperienceRoute><DiscovererDashboard /></ChildExperienceRoute>} />
          <Route path="/thinker/dashboard" element={<ChildExperienceRoute><ThinkerDashboard /></ChildExperienceRoute>} />
          <Route path="/discoverer/mission" element={<ChildExperienceRoute><DailyMission /></ChildExperienceRoute>} />
          <Route path="/discoverer/badges" element={<ChildExperienceRoute><BadgesPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/certificates" element={<ChildExperienceRoute><CertificatesPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/library" element={<ChildExperienceRoute><LibraryPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/explore" element={<ChildExperienceRoute><ExplorePage /></ChildExperienceRoute>} />
          <Route path="/sample-stories" element={<SampleStoriesPage />} />
          <Route path="/paths" element={<PathsPage />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/discoverer/journey" element={<ChildExperienceRoute><JourneyPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/profile" element={<ChildExperienceRoute><ProfilePage /></ChildExperienceRoute>} />
          <Route path="/discoverer/streaks" element={<ChildExperienceRoute><StreaksPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/rewards" element={<ChildExperienceRoute><RewardsPage /></ChildExperienceRoute>} />
          <Route path="/thinker" element={<Thinker />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<ParentRoute><PricingPage /></ParentRoute>} />
          <Route path="/adventures" element={<AdventurePathsPage />} />
          <Route path="/adventures/articles/:articleSlug" element={<DiscovererArticleShortLink />} />
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
          <Route path="/parent/dashboard" element={<ParentRoute><Dashboard /></ParentRoute>} />
          <Route path="/parent/account" element={<ParentRoute><ParentAccountSettingsPage /></ParentRoute>} />
          <Route path="/dashboard" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/support" element={<ParentRoute><SupportPage /></ParentRoute>} />
          <Route path="/messages" element={<ParentRoute><MessagesPage /></ParentRoute>} />
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
              <Route path="admin-users" element={<AdminAdminUsersPage />} />
              <Route path="log" element={<AdminLogPage />} />
              <Route path="quizzes" element={<AdminQuizzesPage />} />
              <Route path="quizzes/:articleId" element={<AdminQuizEditorPage />} />
              <Route path="progress" element={<AdminProgressPage />} />
              <Route path="refunds" element={<AdminRefunds />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route
                path="roles"
                element={<Navigate to="/admin/admin-users" replace />}
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
        </ParentGateProvider>
      </SelectedChildProvider>
    </BrowserRouter>
  )
}
