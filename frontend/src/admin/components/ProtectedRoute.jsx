// fileName: frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore'; 
import NotFoundPage from '../../pages/NotFoundPage'; 

const ProtectedRoute = ({ requiredRole, allowedRoles }) => {
  // Dùng Hook để đảm bảo tính Reactive
  const { user, isAuthenticated } = useAuthStore();

  // 1. Chưa đăng nhập -> Đá về Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra quyền (Hỗ trợ cả allowedRoles dạng mảng hoặc requiredRole dạng chuỗi đơn)
  const userRole = String(user.role || '').toUpperCase();
  const permittedRoles = allowedRoles
    ? allowedRoles.map((r) => String(r).toUpperCase())
    : requiredRole
    ? [String(requiredRole).toUpperCase()]
    : null;

  // Nếu có yêu cầu quyền mà quyền người dùng không nằm trong danh sách cho phép -> 404
  if (permittedRoles && !permittedRoles.includes(userRole)) {
    return <NotFoundPage />; // "Tàng hình" đối với user thường
  }

  // 3. Đúng quyền -> Cho phép truy cập
  return <Outlet />;
};

export default ProtectedRoute;