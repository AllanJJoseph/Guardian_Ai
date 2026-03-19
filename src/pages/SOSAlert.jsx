import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../App';

const SOSAlert = () => {
  const { user } = useAuth();
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [alertType, setAlertType] = useState('emergency');
  const [message, setMessage] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingLocation(false);
          alert('Unable to get location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleSendSOS = () => {
    if (!location) {
      alert('Please wait for location to be detected or refresh location.');
      return;
    }

    // In production, this would send the alert to the backend
    console.log('SOS Alert Sent:', {
      user: user,
      type: alertType,
      message: message,
      location: location,
      timestamp: new Date().toISOString()
    });

    setAlertSent(true);
    setIsAlertActive(true);

    // Simulate alert being active for 30 seconds
    setTimeout(() => {
      setAlertSent(false);
    }, 5000);
  };

  const alertTypes = [
    { value: 'emergency', label: 'Emergency - Immediate Danger', color: 'bg-red-600' },
    { value: 'harassment', label: 'Harassment', color: 'bg-orange-600' },
    { value: 'following', label: 'Being Followed', color: 'bg-yellow-600' },
    { value: 'suspicious', label: 'Suspicious Activity', color: 'bg-blue-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS Alert System</h1>
        <p className="text-gray-600">
          Send an emergency alert to nearby responders with your real-time location
        </p>
      </div>

      {/* Alert Success Message */}
      {alertSent && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-green-800 font-semibold">Alert Sent Successfully!</h3>
              <p className="text-green-700 text-sm">
                Nearby responders have been notified. Help is on the way.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Alert Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Location Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-600" />
              Your Location
            </h3>
            <button
              onClick={getLocation}
              disabled={loadingLocation}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {loadingLocation ? 'Getting location...' : 'Refresh Location'}
            </button>
          </div>
          {location ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Latitude:</strong> {location.latitude.toFixed(6)}<br />
                <strong>Longitude:</strong> {location.longitude.toFixed(6)}<br />
                <strong>Accuracy:</strong> ±{Math.round(location.accuracy)}m
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                {loadingLocation ? 'Detecting your location...' : 'Location not available'}
              </p>
            </div>
          )}
        </div>

        {/* Alert Type Selection */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Alert Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alertTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setAlertType(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  alertType === type.value
                    ? `${type.color} text-white border-transparent`
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Message */}
        <div className="mb-6">
          <label htmlFor="message" className="block text-lg font-semibold text-gray-900 mb-2">
            Additional Information (Optional)
          </label>
          <textarea
            id="message"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the situation, number of people involved, vehicle details, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Send SOS Button */}
        <button
          onClick={handleSendSOS}
          disabled={!location || isAlertActive}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center transition-all ${
            !location || isAlertActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
          }`}
        >
          <Send className="h-6 w-6 mr-2" />
          {isAlertActive ? 'Alert Active' : 'Send SOS Alert'}
        </button>

        {isAlertActive && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-red-600 animate-pulse">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-semibold">Alert is active - Help is on the way</span>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-gray-600" />
          Emergency Contacts
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-md">
            <div>
              <p className="font-semibold text-gray-900">National Emergency</p>
              <p className="text-sm text-gray-600">Police, Fire, Medical</p>
            </div>
            <a href="tel:112" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              112
            </a>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-md">
            <div>
              <p className="font-semibold text-gray-900">Women Helpline</p>
              <p className="text-sm text-gray-600">24/7 Support</p>
            </div>
            <a href="tel:1091" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              1091
            </a>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-md">
            <div>
              <p className="font-semibold text-gray-900">Child Helpline</p>
              <p className="text-sm text-gray-600">24/7 Support</p>
            </div>
            <a href="tel:1098" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              1098
            </a>
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Safety Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Move to a public, well-lit area if possible</li>
          <li>Call emergency services (112) if in immediate danger</li>
          <li>Keep your phone charged and location services enabled</li>
          <li>Share your live location with trusted contacts</li>
        </ul>
      </div>
    </div>
  );
};

export default SOSAlert;
