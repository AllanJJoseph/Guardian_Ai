import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Activity, AlertTriangle, Users, MapPin, Filter, Clock, Navigation, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getMissingPersons } from '../services/database';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Helper function to open Google Maps with directions
const openGoogleMapsDirections = (lat, lng, personName) => {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(mapsUrl, '_blank');
};

const LiveMap = () => {
  const [selectedLayers, setSelectedLayers] = useState({
    sosAlerts: true,
    missingPersons: true,
    reports: true,
  });
  const [missingPersons, setMissingPersons] = useState([]);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load missing persons from Firestore
  useEffect(() => {
    const loadMissingPersons = async () => {
      try {
        const result = await getMissingPersons('active');
        if (result.success) {
          setMissingPersons(result.data || []);
          console.log('✅ Loaded missing persons from Firestore');
        }
      } catch (err) {
        console.error('Error loading missing persons:', err);
      }
    };
    loadMissingPersons();

    // Real-time listener
    const unsubscribe = onSnapshot(
      query(collection(db, 'missing_persons'), where('status', '==', 'active')),
      (snapshot) => {
        const persons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        setMissingPersons(persons);
        console.log('🔄 Real-time update: Missing persons');
      }
    );
    return () => unsubscribe();
  }, []);

  // Load SOS Alerts from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'sos_alerts'), where('status', '==', 'active')),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().createdAt?.toDate(),
        }));
        setSOSAlerts(alerts);
        console.log('✅ Loaded SOS alerts from Firestore');
      }
    );
    return () => unsubscribe();
  }, []);

  // Load Reports from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        const reportsData = snapshot.docs.slice(0, 5).map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().createdAt?.toDate(),
        }));
        setReports(reportsData);
        console.log('✅ Loaded reports from Firestore');
      }
    );
    setLoading(false);
    return () => unsubscribe();
  }, []);

  const toggleLayer = (layer) => {
    setSelectedLayers({
      ...selectedLayers,
      [layer]: !selectedLayers[layer],
    });
  };

  const getTimeSince = (date) => {
    const minutes = Math.floor((new Date() - date) / (1000 * 60));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Live Map Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar - Filter Panel */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filters & Layers</h2>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-3 mb-6">
              <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedLayers.sosAlerts
                    ? 'bg-red-50 border-red-500'
                    : 'bg-gray-50 border-gray-300'
                }`}
                onClick={() => toggleLayer('sosAlerts')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-gray-900">SOS Alerts</span>
                  </div>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {sosAlerts.length}
                  </span>
                </div>
              </div>

              <div
                onClick={() => toggleLayer('missingPersons')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedLayers.missingPersons
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="font-medium text-gray-900">Missing Persons</span>
                  </div>
                  <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                    {missingPersons.length}
                  </span>
                </div>
              </div>

              <div
                onClick={() => toggleLayer('reports')}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedLayers.reports
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Public Reports</span>
                  </div>
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {reports.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Missing Persons List */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Missing Persons
              </h3>
              <div className="space-y-2">
                {missingPersons.length > 0 ? (
                  missingPersons.map((person) => (
                    <div key={person.id} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{person.name}</span>
                        <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">{person.age} yrs</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Last seen: {getTimeSince(person.lastSeen || person.createdAt)}</p>
                      {person.coordinates && (
                        <button
                          onClick={() => openGoogleMapsDirections(person.coordinates[0], person.coordinates[1], person.name)}
                          className="w-full flex items-center justify-center gap-2 text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors"
                        >
                          <Navigation className="h-3 w-3" />
                          Get Directions
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-600">No missing persons</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {sosAlerts.slice(0, 2).map((alert) => (
                  <div key={alert.id} className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-red-800">{alert.type || 'SOS Alert'}</span>
                      <span className="text-xs text-red-600">{getTimeSince(alert.time)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                  </div>
                ))}

                {reports.slice(0, 2).map((report) => (
                  <div key={report.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-800">Report</span>
                      <span className="text-xs text-blue-600">{getTimeSince(report.time)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{report.reporter || 'Anonymous'}</p>
                    <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map - OpenStreetMap */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Missing Persons Markers */}
            {selectedLayers.missingPersons &&
              missingPersons.map((person) => (
                person.coordinates && (
                  <React.Fragment key={person.id}>
                    <Marker position={person.coordinates} icon={createCustomIcon('#ea580c')}>
                      <Popup>
                        <div className="p-2">
                          <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 text-orange-600 mr-2" />
                            <h3 className="font-bold text-gray-900">Missing Person</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Name:</strong> {person.name}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Age:</strong> {person.age} years
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Last Seen:</strong> {getTimeSince(person.lastSeen || person.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">{person.description}</p>
                          <button
                            onClick={() => openGoogleMapsDirections(person.coordinates[0], person.coordinates[1], person.name)}
                            className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                          >
                            Get Directions →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={person.coordinates}
                      radius={1000}
                      pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.1 }}
                    />
                  </React.Fragment>
                )
              ))}

            {/* SOS Alerts Markers */}
            {selectedLayers.sosAlerts &&
              sosAlerts.map((alert) => (
                alert.location && (
                  <React.Fragment key={alert.id}>
                    <Marker position={alert.location} icon={createCustomIcon('#dc2626')}>
                      <Popup>
                        <div className="p-2">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                            <h3 className="font-bold text-gray-900">SOS Alert</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Type:</strong> {alert.type || 'Emergency'}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Reporter:</strong> {alert.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Time:</strong> {getTimeSince(alert.time)}
                          </p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={alert.location}
                      radius={500}
                      pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.1 }}
                    />
                  </React.Fragment>
                )
              ))}

            {/* Reports Markers */}
            {selectedLayers.reports &&
              reports.map((report) => (
                report.location && (
                  <Marker key={report.id} position={report.location} icon={createCustomIcon('#2563eb')}>
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-bold text-gray-900">Public Report</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Reporter:</strong> {report.reporter || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Time:</strong> {getTimeSince(report.time)}
                        </p>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-600 rounded-full mr-2"></div>
                <span className="text-xs text-gray-700">Missing Persons</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
                <span className="text-xs text-gray-700">SOS Alerts</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-xs text-gray-700">Public Reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveMap;
