import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "./AuthProvider";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();

  // ✅ Wait for AuthProvider to finish checking
  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  // ✅ Redirect unauthenticated users
  if (!user) {
    console.log("🔒 Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Authenticated → render route
  return <Outlet />;
}
