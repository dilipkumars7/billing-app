// src/pages/index.tsx
import { Routes, Route, Navigate } from "react-router";
import Login from "./login";
import NotFound from "./not-found";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "./layout";
import Dashboard from "./dashboard";
import List from './list';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      {/* Protected route */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="list" element={<List />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
