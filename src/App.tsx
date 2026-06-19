import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProtectedRoute, useAuth } from './components/ProtectedRoute'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { ParentGateProvider } from './context/ParentGateContext'
import ParentGateRoute from './components/parent/ParentGateRoute'
import { VoiceSettingsProvider } from './context/VoiceSettingsContext'
import AdventureChildGuard from './components/adventure/AdventureChildGuard'
import AdventurePathAccessGate from './components/adventure/AdventurePathAccessGate'
import AdventureArticleAccessGate from './components/adventure/AdventureArticleAccessGate'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
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
import DiscoverPage from './pages/DiscoverPage'
import PublicExplorePage from './pages/PublicExplorePage'
import GamesPage from './pages/GamesPage'
import ColouringGalleryPage from './pages/colouring/ColouringGalleryPage'
import ColouringEditorPage from './pages/colouring/ColouringEditorPage'
import DrawingGalleryPage from './pages/drawing/DrawingGalleryPage'
import DrawingEditorPage from './pages/drawing/DrawingEditorPage'
import DailyChallengePage from './pages/games/DailyChallengePage'
import QuizBattlePage from './pages/games/QuizBattlePage'
import WordExplorerPage from './pages/games/WordExplorerPage'
import StoryBuilderPage from './pages/games/StoryBuilderPage'
import KnowledgeMapPage from './pages/games/KnowledgeMapPage'
import HeroMatchPage from './pages/games/HeroMatchPage'
import LibraryPage from './pages/discoverer/LibraryPage'
import SampleStoriesPage from './pages/SampleStoriesPage'
import PathsPage from './pages/PathsPage'
import PathDetailPage from './pages/PathDetailPage'
import AvatarPage from './pages/profile/AvatarPage'
import ParentsPage from './pages/ParentsPage'
import ProfilePage from './pages/discoverer/ProfilePage'
import StreaksPage from './pages/discoverer/StreaksPage'
import RewardsPage from './pages/discoverer/RewardsPage'
import DiscovererArticleShortLink from './pages/discoverer/DiscovererArticleShortLink'
import Thinker from './pages/Thinker'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/onboarding/VerifyEmailPage'
import ParentOnboardingPage from './pages/onboarding/ParentOnboardingPage'
import ParentPasscodeSetupPage from './pages/onboarding/ParentPasscodeSetupPage'
import ChooseAgeGroupPage from './pages/onboarding/ChooseAgeGroupPage'
import ChildProfileEditGate from './components/parent/ChildProfileEditGate'
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
import AdminTeamPage from './pages/admin/AdminTeamPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage'
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
import AdminPricingPage from './pages/admin/AdminPricingPage'
import AdminDiscounts from './pages/admin/AdminDiscounts'
import AdminRefunds from './pages/admin/AdminRefunds'
import AdminProgressPage from './pages/admin/AdminProgressPage'
import AdminProfileSettingsPage from './pages/admin/AdminProfileSettingsPage'
import SupportPage from './pages/SupportPage'
import MessagesPage from './pages/MessagesPage'
import AdminMessagesPage from './pages/admin/AdminMessagesPage'
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage'
import { DefaultSeo } from './components/seo/PageSeo'
import AuthCallbackRedirect from './components/auth/AuthCallbackRedirect'
import AppShell from './components/layout/AppShell'
import AgeAwareNavRedirect from './components/routing/AgeAwareNavRedirect'
import {
  hasAuthCallbackInUrl,
  authCallbackRouteWithCallback,
} from './lib/auth/authCallback'
import { STORAGE_KEYS as ADVENTURE_STORAGE_KEYS } from './lib/adventure/constants'

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (hasAuthCallbackInUrl()) {
    return <Navigate to={authCallbackRouteWithCallback()} replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/welcome" replace />
  }

  const activeChildId =
    localStorage.getItem(ADVENTURE_STORAGE_KEYS.activeChild) ??
    localStorage.getItem(ADVENTURE_STORAGE_KEYS.selectedChildId)

  if (!activeChildId) {
    return <Navigate to="/children" replace />
  }

  return <Navigate to="/home" replace />
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
      <DefaultSeo />
      <AuthCallbackRedirect />
      <SelectedChildProvider>
        <ParentGateProvider>
        <VoiceSettingsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/onboarding/parent" element={<ParentOnboardingPage />} />
          <Route path="/onboarding/passcode" element={<ProtectedRoute><ParentPasscodeSetupPage /></ProtectedRoute>} />
          <Route path="/onboarding/choose-path" element={<ChooseAgeGroupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />

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
              <Route path="team" element={<AdminTeamPage />} />
              <Route path="admin-users" element={<Navigate to="/admin/team" replace />} />
              <Route path="log" element={<AdminLogPage />} />
              <Route path="quizzes" element={<AdminQuizzesPage />} />
              <Route path="quizzes/:articleId" element={<AdminQuizEditorPage />} />
              <Route path="progress" element={<AdminProgressPage />} />
              <Route path="refunds" element={<AdminRefunds />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route
                path="roles"
                element={<Navigate to="/admin/team" replace />}
              />
              <Route path="articles" element={<AdminArticlesPage />} />
              <Route path="articles/new" element={<AdminArticleEditorPage />} />
              <Route path="articles/:id" element={<AdminArticleEditorPage />} />
              <Route path="paths" element={<AdminPathsPage />} />
              <Route path="paths/new" element={<AdminPathEditorPage />} />
              <Route path="paths/:id" element={<AdminPathEditorPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="children" element={<AdminChildrenPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="pricing" element={<AdminPricingPage />} />
              <Route path="discounts" element={<AdminDiscounts />} />
            </Route>
          </Route>

          <Route element={<AppShell />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/discoverer" element={<Discoverer />} />
          <Route path="/children" element={<ProtectedRoute><ChildrenPage /></ProtectedRoute>} />
          <Route path="/children/new" element={<ProtectedRoute><ChildProfileFormPage /></ProtectedRoute>} />
          <Route path="/children/:childProfileId/edit" element={<ProtectedRoute><ChildProfileEditGate><ChildProfileFormPage /></ChildProfileEditGate></ProtectedRoute>} />
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
          <Route path="/paths/:pathSlug" element={<PathDetailPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/explore" element={<PublicExplorePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/daily-challenge" element={<DailyChallengePage />} />
          <Route path="/games/quiz-battle" element={<QuizBattlePage />} />
          <Route path="/games/word-explorer" element={<WordExplorerPage />} />
          <Route path="/games/story-builder" element={<StoryBuilderPage />} />
          <Route path="/games/knowledge-map" element={<KnowledgeMapPage />} />
          <Route path="/games/hero-match" element={<HeroMatchPage />} />
          <Route path="/colouring" element={<ColouringGalleryPage />} />
          <Route path="/colouring/:illustrationId" element={<ColouringEditorPage />} />
          <Route path="/drawing" element={<DrawingGalleryPage />} />
          <Route path="/drawing/:referenceId" element={<DrawingEditorPage />} />
          <Route path="/home" element={<ProtectedRoute><AgeAwareNavRedirect target="home" /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><AgeAwareNavRedirect target="explore" /></ProtectedRoute>} />
          <Route path="/discover/featured" element={<Navigate to="/sample-stories" replace />} />
          <Route path="/discover/new" element={<Navigate to="/discoverer/explore" replace />} />
          <Route path="/discover/popular" element={<Navigate to="/discoverer/explore" replace />} />
          <Route path="/discover/recommended" element={<Navigate to="/discoverer/explore" replace />} />
          <Route path="/achievements" element={<ProtectedRoute><AgeAwareNavRedirect target="achievements" /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><AgeAwareNavRedirect target="certificates" /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><AgeAwareNavRedirect target="journey" /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AgeAwareNavRedirect target="profile" /></ProtectedRoute>} />
          <Route path="/profile/avatar" element={<ChildExperienceRoute><AvatarPage /></ChildExperienceRoute>} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/discoverer/journey" element={<Navigate to="/discoverer/dashboard" replace />} />
          <Route path="/discoverer/profile" element={<ChildExperienceRoute><ProfilePage /></ChildExperienceRoute>} />
          <Route path="/discoverer/streaks" element={<ChildExperienceRoute><StreaksPage /></ChildExperienceRoute>} />
          <Route path="/discoverer/rewards" element={<ChildExperienceRoute><RewardsPage /></ChildExperienceRoute>} />
          <Route path="/thinker" element={<Thinker />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<PricingPage />} />
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
          <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/parent/dashboard" element={<ParentRoute><Dashboard /></ParentRoute>} />
          <Route path="/parent/progress" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/parent/messages" element={<Navigate to="/messages" replace />} />
          <Route path="/parent/subscription" element={<Navigate to="/account/settings" replace />} />
          <Route path="/parent/settings" element={<Navigate to="/account/settings" replace />} />
          <Route path="/parent/support" element={<Navigate to="/support" replace />} />
          <Route path="/parent/account" element={<Navigate to="/account/settings" replace />} />
          <Route path="/account/settings" element={<ParentRoute><ParentAccountSettingsPage /></ParentRoute>} />
          <Route path="/dashboard" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/support" element={<ParentRoute><SupportPage /></ParentRoute>} />
          <Route path="/messages" element={<ParentRoute><MessagesPage /></ParentRoute>} />
          <Route path="/child-dashboard" element={<ProtectedRoute><ChildDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Route>
        </Routes>
        </VoiceSettingsProvider>
        </ParentGateProvider>
      </SelectedChildProvider>
    </BrowserRouter>
  )
}
