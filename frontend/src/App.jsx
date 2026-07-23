import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashboard';
import TraineeDetail from '@/pages/TraineeDetail';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Users from '@/pages/Users';
import Courses from '@/pages/Courses';
import HowToUse from '@/pages/HowToUse';
import TraineeSelfReport from '@/pages/TraineeSelfReport';
import Footer from '@/components/Footer';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/report" element={<TraineeSelfReport />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainees/:traineeId"
          element={
            <ProtectedRoute>
              <TraineeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/how-to-use"
          element={
            <ProtectedRoute>
              <HowToUse />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}
