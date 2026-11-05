import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VendorsPage from './pages/vendors/VendorsPage';
import RequestsPage from './pages/requests/RequestsPage';
import ShipsPage from './pages/ships/ShipsPage';
import WorkspacePage from './pages/workspace/WorkspacePage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';
import { Loading } from './components/Ui';

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/" element={<Guard><AppLayout /></Guard>}>
        <Route index element={<DashboardPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="requests" element={<Guard roles={['Administrator', 'Executive']}><RequestsPage /></Guard>} />
        <Route path="ships" element={<Guard roles={['Administrator', 'Executive']}><ShipsPage /></Guard>} />
        <Route path="ships/:id" element={<Guard roles={['Administrator', 'Executive']}><ShipsPage /></Guard>} />
        <Route path="workspace" element={<Guard roles={['Administrator', 'Executive']}><WorkspacePage /></Guard>} />
        <Route path="inventory" element={<Navigate to="/workspace" replace />} />
        <Route path="planning" element={<Navigate to="/workspace" replace />} />
        <Route path="approvals" element={<Guard roles={['Administrator']}><ApprovalsPage /></Guard>} />
        <Route path="reports" element={<Guard roles={['Administrator']}><ReportsPage /></Guard>} />
        <Route path="users" element={<Guard roles={['User Administrator']}><UsersPage /></Guard>} />
        <Route path="settings" element={<Guard roles={['User Administrator']}><SettingsPage /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
