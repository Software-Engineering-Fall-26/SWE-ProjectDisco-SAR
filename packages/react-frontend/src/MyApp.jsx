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
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span className="brand-copy">
            <span className="brand-name">Disco</span>
            <span className="brand-tag">Idea studio</span>
          </span>
        </div>

        <div className="sidebar-nav">
          <NavLink to="/ideas" className="sidebar-link">
            Ideas
          </NavLink>

          <NavLink to="/board" className="sidebar-link">
            Idea Board
          </NavLink>
        </div>

        <NavLink to="/profile" className="sidebar-link account-link">
          Account
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
    return (
      <div className="boot-screen">
        <span className="brand-mark" aria-hidden="true">
          D
        </span>
        <p>Loading Disco</p>
      </div>
    );
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
