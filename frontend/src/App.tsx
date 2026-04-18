import { BrowserRouter, Routes, Route, } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./components/auth/AuthContext";
import LoginPage from "./components/auth/login/Login";
import RegisterPage from "./components/auth/register/Register";
import LandingPage from "./pages/landingpage/LandingPage";
import Dashboard from "./pages/dashboard/Dashboard";
import Battery from "./components/battery/Battery";
import GPS from "./components/gps/GPS";
import Water from "./components/water/Water";
import Attitude from "./components/attitude/Attitude";
import Graph from "./components/graph/Graph";
import Camera from "./components/camera/Camera";
import Profil from "./components/profil/Profil";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/battery" element={<Battery />} />
          <Route path="/gps" element={<GPS />} />
          <Route path="/water" element={<Water />} />
          <Route path="/attitude" element={<Attitude />} />   
          <Route path="/graph" element={<Graph />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/profil" element={<Profil />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;