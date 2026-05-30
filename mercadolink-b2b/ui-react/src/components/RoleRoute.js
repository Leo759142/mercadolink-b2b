import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccess } from '../utils/auth';

export default function RoleRoute({ module, children }) {
  const rol = localStorage.getItem('rol');
  if (!canAccess(module, rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
