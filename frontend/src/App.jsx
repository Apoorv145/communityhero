import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Trophy, User, PlusCircle, LogOut } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import ReportIssue from './pages/ReportIssue'
import Leaderboard from './pages/Leaderboard'
import Auth from './pages/Auth'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
}

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { path: '/report', icon: <PlusCircle size={24} />, label: 'Report Issue' },
    { path: '/leaderboard', icon: <Trophy size={24} />, label: 'Leaderboard' },
  ];

  return (
    <aside className="sidebar glass-panel flex-col">
      <div className="logo-container flex items-center gap-2">
        <img src="/logo.png" alt="Logo" style={{width: '36px', height: '36px', borderRadius: '8px'}} />
        <h1 className="font-bold text-xl text-gradient">Community Hero</h1>
      </div>
      
      <nav className="nav-menu flex-col gap-2" style={{marginTop: '2rem'}}>
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item flex items-center gap-4 ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="user-profile flex-col gap-4" style={{marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)'}}>
        <div className="flex items-center gap-3">
          <div className="avatar flex items-center justify-center" style={{minWidth: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'}}>
            <User size={20} color="white" />
          </div>
          <div style={{overflow: 'hidden'}}>
            <p className="font-bold text-sm truncate" title={currentUser?.email}>{currentUser?.email || 'Guest'}</p>
            <p className="text-xs text-muted" style={{color: 'var(--accent-color)'}}>Citizen</p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary w-full text-sm py-2">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<Auth />} />
      <Route path="/" element={
        <PrivateRoute>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Dashboard />
            </main>
          </div>
        </PrivateRoute>
      } />
      <Route path="/report" element={
        <PrivateRoute>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <ReportIssue />
            </main>
          </div>
        </PrivateRoute>
      } />
      <Route path="/leaderboard" element={
        <PrivateRoute>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Leaderboard />
            </main>
          </div>
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
