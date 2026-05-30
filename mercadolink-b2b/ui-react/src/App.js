import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Login from './components/Login';
import Pedidos from './components/Pedidos';
import PlaceholderPanel from './components/PlaceholderPanel';
import PrivateRoute from './components/PrivateRoute';
import Productos from './components/Productos';
import Register from './components/Register';
import RoleRoute from './components/RoleRoute';
import './index.css';

export default function App() {
  console.log('[NEW-LOG] React App render');
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
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
              <PlaceholderPanel
                title="Gestión de proveedores"
                subtitle="Cotizaciones, evaluaciones y RUC · Servicio GestionProveedores"
                fase="Fase B — entidades proveedores, cotizaciones y evaluaciones en BD + API"
              />
            </RoleRoute>
          }
        />
        <Route
          path="logistica"
          element={
            <RoleRoute module="logistica">
              <PlaceholderPanel
                title="Logística y recepción"
                subtitle="Envíos, actas de recepción y no conformidades · Servicio LogisticaEntrega"
                fase="Fase C — tablas envios, recepciones, no_conformidades del SQL"
              />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}