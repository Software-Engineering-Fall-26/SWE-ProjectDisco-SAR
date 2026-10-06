import { Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import Login from "./Login";
import Ideas from "./Ideas";
import IdeaBoard from "./IdeaBoard";
import Profile from "./Profile";
import ResetPassword from "./ResetPassword";

function AppLayout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <NavLink to="/ideas" className="sidebar-link">
          Ideas
        </NavLink>

        <NavLink to="/board" className="sidebar-link">
          Idea Board
        </NavLink>

        <NavLink to="/profile" className="sidebar-link account-link">
          View Account
        </NavLink>
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="page-content">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function MyApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/board" element={<IdeaBoard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default MyApp;
