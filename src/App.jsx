import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Layout from './components/Layout';
import { issueService } from './services/issueService';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminClients = lazy(() => import('./pages/admin/Clients'));
const AdminClientDetail = lazy(() => import('./pages/admin/ClientDetail'));
const AdminProjects = lazy(() => import('./pages/admin/Projects'));
const CreateProjectModal = lazy(() => import('./pages/admin/Projects').then((module) => ({ default: module.CreateProjectModal })));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminIssues = lazy(() => import('./pages/admin/Issues'));
const AdminBoard = lazy(() => import('./pages/admin/Board'));
const AdminBacklog = lazy(() => import('./pages/admin/Backlog'));
const AdminActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminIntegrations = lazy(() => import('./pages/admin/Integrations'));
const ModuleFeatureManager = lazy(() => import('./pages/admin/ModuleFeatureManager'));
const ModuleTaskBoard = lazy(() => import('./pages/admin/ModuleTaskBoard'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerProjects = lazy(() => import('./pages/manager/ManagerProjects'));
const ManagerTeam = lazy(() => import('./pages/manager/ManagerTeam'));
const ManagerIssues = lazy(() => import('./pages/admin/Issues'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmployeeTasks = lazy(() => import('./pages/employee/EmployeeTasks'));
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientProjects = lazy(() => import('./pages/client/ClientProjects'));
const ClientIssues = lazy(() => import('./pages/client/ClientIssues'));
const ReportIssueModal = lazy(() => import('./pages/client/ClientIssues').then((module) => ({ default: module.ReportIssueModal })));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AnalyticsReports = lazy(() => import('./components/AnalyticsReports'));

const EMPLOYEE_ROLES = [
  'employee', 'frontend_developer', 'backend_developer',
  'fullstack_developer', 'devops', 'qa_tester', 'ui_ux_designer'
];

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role;

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleCreateIssue = () => {
    setShowCreateIssueModal(true);
  };

  // Admin routes
  if (role === 'admin') {
    return (
      <Layout onCreateProject={handleCreateProject} onCreateIssue={handleCreateIssue}>
        {showCreateProjectModal && (
          <CreateProjectModal
            onClose={() => setShowCreateProjectModal(false)}
            onCreated={() => setShowCreateProjectModal(false)}
          />
        )}
        <Routes>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/clients" element={<AdminClients />} />
          <Route path="/clients/:id" element={<AdminClientDetail />} />
          <Route path="/projects" element={<AdminProjects showCreateModal={showCreateProjectModal} onCloseCreateModal={() => setShowCreateProjectModal(false)} />} />
          <Route path="/projects/:projectSlug/tasks" element={<ModuleTaskBoard />} />
          <Route path="/projects/:projectSlug/tasks/:taskSlug" element={<ModuleTaskBoard />} />
          <Route path="/projects/:projectSlug/modules" element={<ModuleFeatureManager />} />
          <Route path="/projects/:projectSlug/modules/:moduleSlug" element={<ModuleFeatureManager />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/issues" element={<AdminIssues showCreateModal={showCreateIssueModal} onCloseCreateModal={() => setShowCreateIssueModal(false)} />} />
          <Route path="/board" element={<AdminBoard />} />
          <Route path="/backlog" element={<AdminBacklog />} />
          <Route path="/reports" element={<AnalyticsReports />} />
          <Route path="/activity" element={<AdminActivityLogs />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/integrations" element={<AdminIntegrations />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  // Manager routes
  if (role === 'manager') {
    return (
      <Layout onCreateProject={handleCreateProject} onCreateIssue={handleCreateIssue}>
        <Routes>
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="/projects" element={<ManagerProjects showCreateModal={showCreateProjectModal} onCloseCreateModal={() => setShowCreateProjectModal(false)} />} />
          <Route path="/projects/:projectSlug/tasks" element={<ModuleTaskBoard />} />
          <Route path="/projects/:projectSlug/tasks/:taskSlug" element={<ModuleTaskBoard />} />
          <Route path="/projects/:projectSlug/modules" element={<ModuleFeatureManager />} />
          <Route path="/projects/:projectSlug/modules/:moduleSlug" element={<ModuleFeatureManager />} />
          <Route path="/team" element={<ManagerTeam />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/issues" element={<ManagerIssues showCreateModal={showCreateIssueModal} onCloseCreateModal={() => setShowCreateIssueModal(false)} />} />
          <Route path="/board" element={<AdminBoard />} />
          <Route path="/backlog" element={<AdminBacklog />} />
          <Route path="/reports" element={<AnalyticsReports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  // Client routes
  if (role === 'client') {
    return (
      <Layout onCreateIssue={handleCreateIssue}>
        {showCreateIssueModal && (
          <ReportIssueModal
            onClose={() => setShowCreateIssueModal(false)}
            onSubmit={async (form) => {
              const formData = new FormData();
              formData.append('title', form.title);
              formData.append('description', form.description);
              formData.append('issue_type', form.issue_type);
              formData.append('priority', form.priority);
              formData.append('project', form.project);
              form.screenshots.forEach((file) => formData.append('screenshots', file));
              await issueService.create(formData);
              setShowCreateIssueModal(false);
            }}
          />
        )}
        <Routes>
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/projects" element={<ClientProjects />} />
          <Route path="/issues" element={<ClientIssues showCreateModal={showCreateIssueModal} onCloseCreateModal={() => setShowCreateIssueModal(false)} />} />
          <Route path="/reports" element={<AnalyticsReports />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  // Employee roles (employee, frontend_developer, backend_developer, etc.)
  if (EMPLOYEE_ROLES.includes(role)) {
    return (
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/tasks" element={<EmployeeTasks />} />
          <Route path="/reports" element={<AnalyticsReports />} />
          <Route path="/board" element={<AdminBoard />} />
          <Route path="/backlog" element={<AdminBacklog />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<div role="status" style={{ padding: 24, color: 'hsl(var(--muted-foreground))' }}>Loading...</div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/" element={<RootRedirect />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
