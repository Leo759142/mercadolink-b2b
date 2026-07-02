import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Auditoria from './components/Auditoria';
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Login from './components/Login';
import Logistica from './components/Logistica';
import Pedidos from './components/Pedidos';
import PedidosProveedor from './components/PedidosProveedor';
import PrivateRoute, { PublicRoute } from './components/PrivateRoute';
import Productos from './components/Productos';
import Proveedores from './components/Proveedores';
import ProveedorInventario from './components/ProveedorInventario';
import Register from './components/Register';
import RoleRoute from './components/RoleRoute';
import './index.css';

export default function App() {
  console.log('[NEW-LOG] React App render');
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="inventario"
          element={
            <RoleRoute module="inventario">
              <Inventario />
            </RoleRoute>
          }
        />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="productos" element={<Productos />} />
        <Route
          path="proveedores"
          element={
            <RoleRoute module="proveedores">
              <Proveedores />
            </RoleRoute>
          }
        />
        <Route
          path="proveedor-inventario"
          element={
            <RoleRoute module="proveedorInventario">
              <ProveedorInventario />
            </RoleRoute>
          }
        />
        <Route
          path="proveedor-pedidos"
          element={
            <RoleRoute module="proveedores">
              <PedidosProveedor />
            </RoleRoute>
          }
        />
        <Route
          path="logistica"
          element={
            <RoleRoute module="logistica">
              <Logistica />
            </RoleRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <RoleRoute module="auditoria">
              <Auditoria />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}