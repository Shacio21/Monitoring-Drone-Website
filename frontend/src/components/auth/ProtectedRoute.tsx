import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Simpan halaman yang dituju, biar setelah login langsung diarahkan ke sana
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kalau sudah login, render halaman yang diminta
  return <Outlet />;
}
