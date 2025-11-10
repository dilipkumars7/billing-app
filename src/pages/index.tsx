import { Routes, Route, Navigate } from "react-router";
import Login from "./login";
import NotFound from "./not-found";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "./layout";
import Dashboard from "./dashboard";
import List from "./list";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* ✅ Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list" element={<List />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
