import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminNewListing from './pages/AdminNewListing';
import AdminEditListing from './pages/AdminEditListing';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes — có Header + Footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Admin routes — bảo vệ bằng PrivateRoute */}
        <Route element={<Layout />}>
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/listings/new" element={<AdminNewListing />} />
            <Route path="/admin/listings/:id/edit" element={<AdminEditListing />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
