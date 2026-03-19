import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../App';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock authentication - in production, this would call a real API
    const mockUser = {
      id: '1',
      name: email.split('@')[0],
      email: email,
      role: email.includes('ngo') ? 'ngo' : email.includes('police') ? 'police' : 'civilian'
    };

    login(mockUser);
    navigate(from, { replace: true });
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-8 group transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-600">
              Sign in to access your SafeNet account
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-base font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-600">Don't have an account? </span>
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Sign up
            </Link>
          </div>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-700"><strong>Civilian:</strong> user@example.com</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-700"><strong>NGO:</strong> ngo@example.com</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-700"><strong>Police:</strong> police@example.com</span>
              </div>
              <p className="text-slate-500 text-xs italic pt-2">Password: any</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
