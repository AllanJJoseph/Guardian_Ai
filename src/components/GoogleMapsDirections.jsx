import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Smartphone,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getDirections,
  getUserLocation,
  calculateTravelTime,
  openDirectionsInGoogleMaps,
  openDirectionsInAppleMaps,
  loadGoogleMapsScript,
} from '../services/googleMapsService';

const GoogleMapsDirections = ({ location, personName, onClose }) => {
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [directions, setDirections] = useState(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Initialize map and get directions
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load Google Maps API
        await loadGoogleMapsScript();

        // Get user's current location
        const userLoc = await getUserLocation();
        setUserLocation(userLoc);

        // Initialize map
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 14,
          center: {
            lat: (userLoc.lat + location.lat) / 2,
            lng: (userLoc.lng + location.lng) / 2,
          },
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
        });

        // Initialize directions renderer
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
        });
        directionsRendererRef.current = directionsRenderer;

        // Get directions
        const directionsResult = await getDirections(userLoc, location);
        directionsRenderer.setDirections(directionsResult);
        setDirections(directionsResult);

        // Calculate travel time
        const travelData = await calculateTravelTime(userLoc, location);
        setTravelTime(travelData);

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err.message || 'Failed to load directions');
        setLoading(false);
      }
    };

    if (location && mapRef.current) {
      initializeMap();
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [location]);

  const handleOpenInGoogleMaps = () => {
    openDirectionsInGoogleMaps({
      lat: location.lat,
      lng: location.lng,
      name: personName || 'Missing Person Location',
    });
  };

  const handleOpenInAppleMaps = () => {
    openDirectionsInAppleMaps({
      lat: location.lat,
      lng: location.lng,
      name: personName || 'Missing Person Location',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center flex-1">
            <Navigation className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Directions to {personName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {travelTime && (
                  <>
                    Est. {travelTime.distance} • {travelTime.duration}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Unable to load directions
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                💡 Make sure to set up your Google Maps API key in .env file
              </p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading directions...</p>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            className="w-full h-full rounded-lg"
            style={{ display: loading ? 'none' : 'block' }}
          />
        </div>

        {/* Info & Action Buttons */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          {/* Info Row */}
          {travelTime && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-600">Distance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {travelTime.distance}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-600">Est. Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {travelTime.duration}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Navigation className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-600">Mode</p>
                  <p className="text-lg font-semibold text-gray-900">Driving</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOpenInGoogleMaps}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Open in Google Maps
            </button>

            {isIOS && (
              <button
                onClick={handleOpenInAppleMaps}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Open in Apple Maps
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
          </div>

          {/* Safety Tip */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Share your location with authorities or trusted
              contacts before heading to the location. Always prioritize safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsDirections;
