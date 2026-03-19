/**
 * Google Maps Service
 * Handles all Google Maps API related functions
 */

// Initialize Google Maps API key
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Validate API key exists
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ ERROR: VITE_GOOGLE_MAPS_API_KEY not found in .env file');
}

console.log('🔑 Google Maps API Key Status:', GOOGLE_MAPS_API_KEY ? '✓ Set' : '❌ Missing');

// Load Google Maps script dynamically
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if API key is missing
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ API Key Error: VITE_GOOGLE_MAPS_API_KEY is not in .env file');
      reject(new Error('Google Maps API key not configured. Check .env file.'));
      return;
    }

    // Check if already loaded
    if (window.google) {
      console.log('✓ Google Maps already loaded');
      resolve();
      return;
    }

    console.log('📍 Loading Google Maps script...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✓ Google Maps script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API script:', error);
      console.error('🔍 Check:');
      console.error('   1. API key is valid in Google Cloud Console');
      console.error('   2. Required APIs are enabled (Directions, Distance Matrix, Places)');
      console.error('   3. HTTP referrer restrictions allow localhost:5173/*');
      console.error('   4. No billing issues on Google Cloud account');
      reject(new Error('Failed to load Google Maps API - check console for details'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Get directions from origin to destination
 * @param {Object} origin - { lat: number, lng: number }
 * @param {Object} destination - { lat: number, lng: number }
 * @returns {Promise<Object>} Direction details
 */
export const getDirections = async (origin, destination) => {
  try {
    if (!window.google) {
      await loadGoogleMapsScript();
    }

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DirectionsService();
      
      service.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
};

/**
 * Get distance between two coordinates
 * @param {Object} origin - { lat: number, lng: number }
 * @param {Object} destination - { lat: number, lng: number }
 * @returns {Promise<Object>} Distance matrix data
 */
export const getDistance = async (origin, destination) => {
  try {
    if (!window.google) {
      await loadGoogleMapsScript();
    }

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DistanceMatrixStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Distance Matrix request failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting distance:', error);
    throw error;
  }
};

/**
 * Open Google Maps directions in a new tab
 * @param {Object} destination - { lat: number, lng: number, name?: string }
 */
export const openDirectionsInGoogleMaps = (destination) => {
  const { lat, lng, name = 'Location' } = destination;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};

/**
 * Open Apple Maps directions if on iOS
 * @param {Object} destination - { lat: number, lng: number, name?: string }
 */
export const openDirectionsInAppleMaps = (destination) => {
  const { lat, lng, name = 'Location' } = destination;
  const url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  window.location.href = url;
};

/**
 * Get user's current location
 * @returns {Promise<Object>} User's coordinates { lat: number, lng: number }
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported by this browser');
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    console.log('📍 Requesting user location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✓ Location obtained:', { lat: latitude, lng: longitude });
        resolve({
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        console.error('❌ Geolocation error:', error.message);
        console.error('🔍 Error code:', error.code);
        if (error.code === 1) {
          console.error('   → User denied permission. Allow location access in browser settings.');
        } else if (error.code === 2) {
          console.error('   → Location unavailable. Check internet connection or GPS signal.');
        } else if (error.code === 3) {
          console.error('   → Request timeout. Try again.');
        }
        reject(error);
      }
    );
  });
};

/**
 * Calculate estimated time of travel
 * @param {Object} origin - { lat: number, lng: number }
 * @param {Object} destination - { lat: number, lng: number }
 * @returns {Object} { distance: string, duration: string, durationValue: number }
 */
export const calculateTravelTime = async (origin, destination) => {
  try {
    const result = await getDistance(origin, destination);
    const element = result.rows[0].elements[0];
    
    if (element.status === 'OK') {
      return {
        distance: element.distance.text,
        duration: element.duration.text,
        durationValue: element.duration.value, // in seconds
      };
    } else {
      throw new Error('Unable to calculate travel time');
    }
  } catch (error) {
    console.error('Error calculating travel time:', error);
    throw error;
  }
};
