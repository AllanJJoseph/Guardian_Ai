import React, { createContext, useState, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SOSAlert from './pages/SOSAlert';
import MissingPersons from './pages/MissingPersons';
import PublicReporting from './pages/PublicReporting';
import LiveMap from './pages/LiveMap';
import NGODashboard from './pages/NGODashboard';
import AIScanner from './pages/AIScanner';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Protected Route Component
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Role-based Route Component
const RequireRole = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('safenet_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('safenet_user');
  };

  // Check for existing session
  React.useEffect(() => {
    const savedUser = localStorage.getItem('safenet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="sos"
              element={
                <RequireAuth>
                  <SOSAlert />
                </RequireAuth>
              }
            />
            <Route path="missing-persons" element={<MissingPersons />} />
            <Route path="report" element={<PublicReporting />} />
            <Route path="live-map" element={<LiveMap />} />
            <Route
              path="ai-scanner"
              element={
                <RequireRole roles={['ngo', 'police']}>
                  <AIScanner />
                </RequireRole>
              }
            />
            <Route
              path="ngo-dashboard"
              element={
                <RequireRole roles={['ngo', 'police']}>
                  <NGODashboard />
                </RequireRole>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
