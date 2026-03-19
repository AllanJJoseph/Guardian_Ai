import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, Users, MapPin, Activity, BarChart3, Scan, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../App';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Home', path: '/', icon: Shield },
    { name: 'SOS Alert', path: '/sos', icon: AlertTriangle, protected: true },
    { name: 'Missing Persons', path: '/missing-persons', icon: Users },
    { name: 'Report Sighting', path: '/report', icon: MapPin },
    { name: 'Live Map', path: '/live-map', icon: Activity },
  ];

  if (user?.role === 'ngo' || user?.role === 'police') {
    navigation.push(
      { name: 'AI Scanner', path: '/ai-scanner', icon: Scan },
      { name: 'Dashboard', path: '/ngo-dashboard', icon: BarChart3 }
    );
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img src="/guardian-ai-logo.png" alt="Guardian AI" className="h-9 w-9 rounded-lg" />
              <span className="text-xl font-bold text-slate-900">Guardian AI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-slate-100 rounded-lg">
                    <div className="text-sm text-right">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t border-slate-200 pt-3 mt-3">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg mb-2">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-slate-500 text-sm capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 mb-2 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 text-center transition-all"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/guardian-ai-logo.png" alt="Guardian AI" className="h-9 w-9 rounded-lg" />
                <span className="text-xl font-bold">Guardian AI</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Empowering communities to create safer environments for women and children through technology and coordinated response.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
              <div className="space-y-2 text-sm">
                <a href="tel:112" className="flex items-center text-slate-400 hover:text-white transition-colors">
                  National Emergency: <span className="ml-2 font-semibold">112</span>
                </a>
                <a href="tel:1091" className="flex items-center text-slate-400 hover:text-white transition-colors">
                  Women Helpline: <span className="ml-2 font-semibold">1091</span>
                </a>
                <a href="tel:1098" className="flex items-center text-slate-400 hover:text-white transition-colors">
                  Child Helpline: <span className="ml-2 font-semibold">1098</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/sos" className="text-slate-400 hover:text-white transition-colors">SOS Alert</Link></li>
                <li><Link to="/missing-persons" className="text-slate-400 hover:text-white transition-colors">Missing Persons</Link></li>
                <li><Link to="/report" className="text-slate-400 hover:text-white transition-colors">Report Sighting</Link></li>
                <li><Link to="/live-map" className="text-slate-400 hover:text-white transition-colors">Live Map</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-sm text-slate-400">
              &copy; 2026 Guardian AI. All rights reserved. Built for social impact.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
