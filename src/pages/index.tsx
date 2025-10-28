// src/pages/index.tsx
import { Routes, Route, Navigate } from "react-router";
import Dashboard from "./dashboard";
import Login from "./login";
import NotFound from "./not-found";
import ProtectedRoute from "../auth/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      {/* Protected route */}
      <Route path="/*" element={
          <ProtectedRoute>
            <Navbar />
            <Sidebar />
            <section className="hero_section">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </section>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
