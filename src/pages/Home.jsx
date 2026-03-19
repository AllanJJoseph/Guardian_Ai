import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Users, MapPin, Activity, Shield, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { getEnhancedStats } from '../services/database';

const Home = () => {
  const [stats, setStats] = useState([
    { label: 'Active SOS Alerts', value: '—', icon: AlertTriangle, gradient: 'from-danger-500 to-danger-600' },
    { label: 'Missing Persons', value: '—', icon: Users, gradient: 'from-accent-500 to-accent-600' },
    { label: 'Reports Filed', value: '—', icon: MapPin, gradient: 'from-primary-500 to-primary-600' },
    { label: 'AI Scans Run', value: '—', icon: Activity, gradient: 'from-emerald-500 to-emerald-600' },
  ]);

  useEffect(() => {
    getEnhancedStats().then(data => {
      setStats([
        { label: 'Active SOS Alerts', value: String(data.activeAlerts), icon: AlertTriangle, gradient: 'from-danger-500 to-danger-600' },
        { label: 'Missing Persons', value: String(data.missingPersons), icon: Users, gradient: 'from-accent-500 to-accent-600' },
        { label: 'Reports Filed', value: String(data.totalReports), icon: MapPin, gradient: 'from-primary-500 to-primary-600' },
        { label: 'AI Scans Run', value: String(data.totalScans), icon: Activity, gradient: 'from-emerald-500 to-emerald-600' },
      ]);
    });
  }, []);

  const features = [
    {
      title: 'SOS Alert System',
      description: 'Instant emergency alerts with real-time GPS location sharing to nearby responders and authorities.',
      icon: AlertTriangle,
      link: '/sos',
      color: 'danger'
    },
    {
      title: 'Missing Persons Registry',
      description: 'Comprehensive database with real-time updates and advanced search capabilities.',
      icon: Users,
      link: '/missing-persons',
      color: 'accent'
    },
    {
      title: 'Public Reporting',
      description: 'Report sightings with photos, videos, and precise location data to help locate missing persons.',
      icon: MapPin,
      link: '/report',
      color: 'primary'
    },
    {
      title: 'Live Map Dashboard',
      description: 'Real-time visualization of all alerts, reports, and missing persons in your area.',
      icon: Activity,
      link: '/live-map',
      color: 'emerald'
    },
  ];

  const benefits = [
    'One-tap emergency alerts',
    'Real-time location tracking',
    'Community-powered network',
    '24/7 response coordination',
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNEgxNHYtMjJoMjJ2MjJ6bTAgMjJIMTR2LTIyaDIydjIyem0wIDIySDE0di0yMmgyMnYyMnptMjItMjJoLTIydi0yMmgyMnYyMnptMC0yMmgtMjJ2LTIyaDIydjIyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 mb-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Shield className="h-12 w-12 text-accent-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Guardian{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-600">
                AI
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Community-powered safety platform providing real-time alerts, missing persons tracking,
              and coordinated emergency response across your region
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/sos"
                className="group inline-flex items-center justify-center px-8 py-4 bg-danger-600 hover:bg-danger-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                Send SOS Alert
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/missing-persons"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-semibold rounded-xl border-2 border-white/30 hover:border-white/50 transition-all"
              >
                <Users className="mr-2 h-5 w-5" />
                View Missing Persons
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Benefits pills */}
            <div className="flex flex-wrap gap-3 justify-center">
              {benefits.map((benefit, index) => (
                <div key={index} className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-accent-400" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.gradient} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                  <p className="text-slate-600 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comprehensive Safety Tools
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Advanced features designed to ensure rapid response and effective coordination in emergency situations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-slate-50 hover:bg-white rounded-2xl p-8 transition-all hover:shadow-medium border-2 border-transparent hover:border-slate-200"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-${feature.color}-100 text-${feature.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How Guardian AI Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A streamlined three-step process for community safety
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Alert', desc: 'Send instant SOS alerts or report sightings with location and media evidence', color: 'danger' },
              { step: '02', title: 'Coordinate', desc: 'Nearby NGOs, police, and volunteers receive real-time notifications', color: 'primary' },
              { step: '03', title: 'Respond', desc: 'Fast, coordinated response with live tracking and case management', color: 'emerald' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white text-2xl font-bold mb-6 shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0OEgxNHYtMjJoMjJ2MjJ6bTAgMjNIMTR2LTIzaDIydjIzem0wIDIySDE0di0yMmgyMnYyMnptMjMtMjJoLTIzdi0yMmgyM3YyMnptMC0yM2gtMjN2LTIzaDIzdjIzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Make Your Community Safer?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-3xl mx-auto">
            Join thousands of citizens, NGOs, and emergency responders working together to protect vulnerable members of our society
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 text-lg font-semibold rounded-xl hover:bg-slate-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="tel:112"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              <Phone className="mr-2 h-5 w-5" />
              Emergency: 112
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto pt-8 border-t border-white/20">
            <div>
              <div className="text-4xl font-bold mb-2">Active</div>
              <div className="text-primary-100">Community network</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Verified</div>
              <div className="text-primary-100">NGO & Police Partners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Real-time</div>
              <div className="text-primary-100">Emergency Coordination</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
