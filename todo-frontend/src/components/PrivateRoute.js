import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // 如果用户未登录，重定向到登录页面
    return <Navigate to="/login" replace />;
  }

  // 如果用户已登录，渲染子组件
  return children;
}

export default PrivateRoute; 