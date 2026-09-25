import { Routes, Route, NavLink, Outlet } from "react-router-dom";

import Login from "./Login";
import Ideas from "./Ideas";
import Profile from "./Profile";

function AppLayout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <NavLink to="/ideas" className="sidebar-link">
          Ideas
        </NavLink>

        <NavLink to="/profile" className="sidebar-link account-link">
          View Account
        </NavLink>

        <NavLink to="/login" className="sidebar-link">
          Log Out
        </NavLink>
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

function MyApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default MyApp;
