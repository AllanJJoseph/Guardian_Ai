import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { AlertTriangle, BarChart3, CheckCircle, Clock, FileText, MapPin, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { getEnhancedStats } from '../services/database';

const NGODashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [liveSOSAlerts, setLiveSOSAlerts] = useState([]);
  const [liveMissingPersons, setLiveMissingPersons] = useState([]);
  const [liveSightings, setLiveSightings] = useState([]);
  const [newSOSBanner, setNewSOSBanner] = useState(null);
  const [newSightingBanner, setNewSightingBanner] = useState(null);
  const initialLoadRef = useRef(true);
  const initialSightingLoadRef = useRef(true);
  const lastSeenIdRef = useRef(null);
  const lastSeenSightingIdRef = useRef(null);

  const [alertsCollSOSAlerts, setAlertsCollSOSAlerts] = useState([]);
  const [sosCollSOSAlerts, setSOSCollSOSAlerts] = useState([]);

  useEffect(() => {
    setLiveSOSAlerts([...alertsCollSOSAlerts, ...sosCollSOSAlerts]);
  }, [alertsCollSOSAlerts, sosCollSOSAlerts]);

  useEffect(() => {
    // Listener 1: 'alerts' collection (type: 'sos')
    const q1 = query(
      collection(db, 'alerts'),
      where('type', '==', 'sos'),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
    const unsub1 = onSnapshot(q1, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlertsCollSOSAlerts(items);
      // Banner logic
      const latest = items[0] ?? null;
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        lastSeenIdRef.current = latest?.id ?? null;
        return;
      }
      if (latest && lastSeenIdRef.current && latest.id !== lastSeenIdRef.current) {
        setNewSOSBanner(latest);
        setTimeout(() => setNewSOSBanner(null), 6000);
      }
      lastSeenIdRef.current = latest?.id ?? null;
    }, (err) => console.error('SOS alerts listener error:', err));

    // Listener 2: 'sosAlerts' collection (from mobile app's sos_alerts / sosAlerts)
    const q2 = query(
      collection(db, 'sosAlerts'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
    const unsub2 = onSnapshot(q2, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const active = items.filter(a => a.status === 'active');
      setSOSCollSOSAlerts(active);

      // Banner logic for sosAlerts collection too
      const latest = active[0] ?? null;
      if (latest && lastSeenIdRef.current && latest.id !== lastSeenIdRef.current) {
        setNewSOSBanner(latest);
        setTimeout(() => setNewSOSBanner(null), 8000);
      }
      if (latest) lastSeenIdRef.current = latest.id;
    }, (err) => console.error('sosAlerts listener error (may not exist yet):', err));

    return () => { unsub1(); unsub2(); };
  }, []);

  const formatAlertTime = (ts) => {
    try {
      const date = ts?.toDate?.()
        ? ts.toDate()
        : typeof ts?.seconds === 'number'
          ? new Date(ts.seconds * 1000)
          : null;
      return date ? date.toLocaleString() : 'Just now';
    } catch {
      return 'Just now';
    }
  };

  const getDirectionsUrl = (alert) => {
    const lat = alert?.location?.latitude;
    const lng = alert?.location?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  // Track missing persons from both collections separately then merge
  const [mobileMissing, setMobileMissing] = useState([]);
  const [webMissing, setWebMissing] = useState([]);

  useEffect(() => {
    setLiveMissingPersons([...mobileMissing, ...webMissing]);
  }, [mobileMissing, webMissing]);

  useEffect(() => {
    // Consolidated Missing Persons listener (primarily uses standardized 'missingPersons')
    const q1 = query(
      collection(db, 'missingPersons'),
      orderBy('reportedAt', 'desc'),
      limit(50)
    );
    const unsub1 = onSnapshot(q1, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMobileMissing(items.filter((p) => p?.status === 'active'));
    }, (err) => console.error('missingPersons listener error:', err));

    // Legacy support for 'missing_persons' (if any remain)
    const q2 = query(
      collection(db, 'missing_persons'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const unsub2 = onSnapshot(q2, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWebMissing(items.filter((p) => p?.status === 'active'));
    }, (err) => console.error('missing_persons listener error:', err));

    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    // Mobile app: Sighting reports
    const q = query(
      collection(db, 'sightings'),
      orderBy('reportedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setLiveSightings(items.filter((s) => s?.status === 'pending'));

        // Sighting Banner Logic
        const latest = items[0] ?? null;
        if (initialSightingLoadRef.current) {
          initialSightingLoadRef.current = false;
          lastSeenSightingIdRef.current = latest?.id ?? null;
          return;
        }
        if (latest && lastSeenSightingIdRef.current && latest.id !== lastSeenSightingIdRef.current) {
          setNewSightingBanner(latest);
          setTimeout(() => setNewSightingBanner(null), 8000);
        }
        lastSeenSightingIdRef.current = latest?.id ?? null;
      },
      (error) => {
        console.error('Sightings listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      activeAlerts: liveSOSAlerts.length,
      activeCases: liveMissingPersons.length,
      pendingSightings: liveSightings.length,
    };
  }, [liveMissingPersons.length, liveSOSAlerts.length, liveSightings.length]);

  const recentAlerts = useMemo(() => {
    return liveSOSAlerts.map((a) => {
      const lat = a?.location?.latitude;
      const lng = a?.location?.longitude;

      return {
        id: a.id,
        type: 'SOS',
        location:
          typeof lat === 'number' && typeof lng === 'number'
            ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : 'Location unavailable',
        reportedBy: a?.userName || a?.userId || 'Unknown user',
        time: formatAlertTime(a?.timestamp),
        status: 'urgent',
        priority: 'high',
        raw: a,
      };
    });
  }, [liveSOSAlerts]);

  // Build active cases from live Firestore data (missing persons + sightings)
  const activeCases = useMemo(() => {
    const cases = [];
    liveMissingPersons.forEach(p => {
      cases.push({
        id: p.id,
        name: p.name || p.fullName || 'Unknown',
        age: p.age || '-',
        type: 'Missing Person',
        reportDate: formatAlertTime(p.reportedAt || p.createdAt),
        status: p.status || 'active',
        lastUpdate: formatAlertTime(p.updatedAt || p.reportedAt || p.createdAt),
        reports: 0,
      });
    });
    liveSightings.forEach(s => {
      cases.push({
        id: s.id,
        name: s.personName || s.name || 'Sighting Report',
        age: '-',
        type: 'Sighting',
        reportDate: formatAlertTime(s.reportedAt || s.createdAt),
        status: s.status || 'pending',
        lastUpdate: formatAlertTime(s.updatedAt || s.reportedAt || s.createdAt),
        reports: 0,
      });
    });
    return cases;
  }, [liveMissingPersons, liveSightings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* New Sighting in-page notification */}
      {newSightingBanner && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-blue-900 font-bold">New Sighting Reported</h3>
                <p className="text-sm text-blue-800 mt-0.5">
                  Potential sighting of <span className="font-bold">{newSightingBanner.personName || 'a missing person'}</span> at {newSightingBanner.location}.
                </p>
                <p className="text-xs text-blue-700 mt-1">{formatAlertTime(newSightingBanner.reportedAt)}</p>
              </div>
            </div>

            {getDirectionsUrl(newSightingBanner) && (
              <a
                href={getDirectionsUrl(newSightingBanner)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap shadow-sm transition-all"
              >
                Get Directions
              </a>
            )}
          </div>
        </div>
      )}

      {/* New SOS in-page notification */}
      {newSOSBanner && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-bounce">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600 outline-none" />
              </div>
              <div>
                <h3 className="text-red-900 font-black tracking-tight">URGENT SOS ALERT</h3>
                <p className="text-sm text-red-800 mt-0.5">
                  {newSOSBanner?.userName ? `${newSOSBanner.userName} is in an emergency situation.` : 'A life-critical emergency alert was received.'}
                </p>
                <p className="text-xs text-red-700 mt-1">{formatAlertTime(newSOSBanner?.timestamp)}</p>
              </div>
            </div>

            {getDirectionsUrl(newSOSBanner) && (
              <a
                href={getDirectionsUrl(newSOSBanner)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-bold whitespace-nowrap shadow-lg flex items-center"
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                Get Directions
              </a>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'police' ? 'Police' : 'NGO'} Dashboard
              </h1>
            </div>
            <p className="text-gray-600">
              Welcome back, {user?.name}. Manage cases and respond to alerts.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <span className="text-3xl font-bold text-red-600">{stats.activeAlerts}</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Active Alerts</p>
          <p className="text-xs text-gray-500 mt-1">Requiring immediate attention</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-orange-600" />
            <span className="text-3xl font-bold text-orange-600">{stats.activeCases}</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Active Cases</p>
          <p className="text-xs text-gray-500 mt-1">Currently being investigated</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-green-600">{stats.pendingSightings}</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Pending Sightings</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-600">{liveMissingPersons.length + liveSOSAlerts.length}</span>
          </div>
          <p className="text-gray-600 text-sm font-medium">Total Active</p>
          <p className="text-xs text-gray-500 mt-1">Cases + Alerts combined</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'alerts'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Alerts
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'cases'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Cases
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Urgent Alerts Requiring Attention
                  </h4>
                  <p className="text-sm text-red-800">
                    {recentAlerts.filter(a => a.priority === 'high').length} high-priority alerts need immediate response
                  </p>
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="mt-2 text-sm text-red-600 font-medium hover:text-red-700"
                  >
                    View Alerts →
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Cases Pending Update
                  </h4>
                  <p className="text-sm text-blue-800">
                    {liveMissingPersons.length > 0 ? `${Math.min(5, liveMissingPersons.length)} cases need status updates or reports` : 'All cases up to date'}
                  </p>
                  <button className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                    View Cases →
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Community Support
                  </h4>
                  <p className="text-sm text-green-800">
                    Your active monitoring helps bring people home. Keep going!
                  </p>
                </div>

                {/* Mobile app reports (live from Firestore) */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Mobile Reports (Live)</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 text-sm">Missing Persons</h5>
                        <span className="text-xs text-gray-600">{liveMissingPersons.length} active</span>
                      </div>

                      {liveMissingPersons.length === 0 ? (
                        <p className="text-sm text-gray-600">No active missing person reports.</p>
                      ) : (
                        <div className="space-y-2">
                          {liveMissingPersons.slice(0, 5).map((p) => (
                            <div key={p.id} className="border border-gray-100 rounded-md p-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{p?.name || 'Unknown'}</div>
                                  <div className="text-xs text-gray-600 truncate">{p?.location || p?.lastSeen || 'Location unknown'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-600">{formatAlertTime(p?.reportedAt)}</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Reported by: {p?.reportedBy || 'Unknown'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 text-sm">Sightings</h5>
                        <span className="text-xs text-gray-600">{liveSightings.length} pending</span>
                      </div>

                      {liveSightings.length === 0 ? (
                        <p className="text-sm text-gray-600">No pending sightings.</p>
                      ) : (
                        <div className="space-y-2">
                          {liveSightings.slice(0, 5).map((s) => (
                            <div key={s.id} className="border border-gray-100 rounded-md p-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{s?.personName || 'Sighting'}</div>
                                  <div className="text-xs text-gray-600 truncate">{s?.location || 'Location unknown'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-600">{formatAlertTime(s?.reportedAt)}</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Reporter: {s?.reporterName || s?.reportedBy || 'Unknown'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentAlerts.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">No active SOS alerts right now.</p>
                  </div>
                ) : (
                  recentAlerts.map((alert) => {
                    const directionsUrl = getDirectionsUrl(alert.raw);
                    return (
                      <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{alert.type}</h4>
                              <p className="text-sm text-gray-600">{alert.location}</p>
                            </div>
                          </div>
                          {getPriorityBadge(alert.priority)}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Reporter: {alert.reportedBy}</span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {alert.time}
                            </span>
                          </div>

                          {directionsUrl && (
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Directions
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Cases</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                  Create New Case
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reports
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeCases.map((caseItem) => (
                      <tr key={caseItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{caseItem.name}</div>
                            <div className="text-sm text-gray-500">
                              {caseItem.age !== '-' ? `${caseItem.age} years old` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {caseItem.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {caseItem.assignedTo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {caseItem.reports} reports
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-purple-600 hover:text-purple-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900">Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
