import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang kiểm tra quyền truy cập...</div>;
  }

  if (!user) {
    // Chưa đăng nhập, chuyển hướng sang login, lưu lại route định vào
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập, cho phép render các route con
  return <Outlet />;
}
