import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RoleGuard } from './components/common/RoleGuard';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { ProjectGalleryPage } from './pages/public/ProjectGalleryPage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Participant Pages
import { ParticipantDashboardPage } from './pages/participant/DashboardPage';
import { TeamPage } from './pages/participant/TeamPage';
import { SubmissionPage } from './pages/participant/SubmissionPage';

// Judge Pages
import { JudgeDashboardPage } from './pages/judge/JudgeDashboardPage';
import { JudgeReviewPage } from './pages/judge/JudgeReviewPage';

// Organizer Pages
import { MyHackathonsPage } from './pages/organizer/MyHackathonsPage';
import { CreateHackathonPage } from './pages/organizer/CreateHackathonPage';
import { HackathonManagePage } from './pages/organizer/HackathonManagePage';
import { OrganizerDashboardPage } from './pages/organizer/OrganizerDashboardPage';
import { JudgeManagementPage } from './pages/organizer/JudgeManagementPage';
import { AssignmentsPage } from './pages/organizer/AssignmentsPage';
import { RubricManagementPage } from './pages/organizer/RubricManagementPage';
import { ResultsPage } from './pages/organizer/ResultsPage';

// Admin Pages
import { AdminConsolePage } from './pages/admin/AdminConsolePage';

// Error Pages
import { UnauthorizedPage } from './pages/error/UnauthorizedPage';
import { ForbiddenPage } from './pages/error/ForbiddenPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App Layout */}
          <Route element={<RootLayout />}>
            {/* Public Routes (No authentication required) */}
            <Route index element={<LandingPage />} />
            <Route path="projects" element={<ProjectGalleryPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />

            {/* Participant Routes */}
            <Route
              path="dashboard"
              element={
                <RoleGuard allowedRoles={['participant', 'admin']}>
                  <ParticipantDashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="team"
              element={
                <RoleGuard allowedRoles={['participant', 'admin']}>
                  <TeamPage />
                </RoleGuard>
              }
            />
            <Route
              path="submission"
              element={
                <RoleGuard allowedRoles={['participant', 'admin']}>
                  <SubmissionPage />
                </RoleGuard>
              }
            />

            {/* Judge Routes */}
            <Route
              path="judge"
              element={
                <RoleGuard allowedRoles={['judge', 'admin']}>
                  <JudgeDashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="judge/projects/:projectId"
              element={
                <RoleGuard allowedRoles={['judge', 'admin']}>
                  <JudgeReviewPage />
                </RoleGuard>
              }
            />

            {/* Organizer Routes */}
            <Route
              path="organizer"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <MyHackathonsPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/events"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <MyHackathonsPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/events/new"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <CreateHackathonPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/events/:eventId"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <HackathonManagePage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/overview"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <OrganizerDashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/judges"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <JudgeManagementPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/assignments"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <AssignmentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/rubric"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <RubricManagementPage />
                </RoleGuard>
              }
            />
            <Route
              path="organizer/results"
              element={
                <RoleGuard allowedRoles={['organizer', 'admin']}>
                  <ResultsPage />
                </RoleGuard>
              }
            />

            {/* Platform Admin Route */}
            <Route
              path="admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminConsolePage />
                </RoleGuard>
              }
            />

            {/* Direct error routes */}
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="forbidden" element={<ForbiddenPage />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Dedicated Auth Layout */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
