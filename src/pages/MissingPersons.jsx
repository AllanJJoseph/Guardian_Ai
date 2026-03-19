import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Users, Search, MapPin, Clock, Phone, AlertCircle, Filter, Plus, UserPlus, Navigation, CheckCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { getMissingPersons, deleteMissingPerson, markPersonAsFound } from '../services/database';
import AddMissingPersonForm from '../components/AddMissingPersonForm';
import GoogleMapsDirections from '../components/GoogleMapsDirections';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MissingPersons = () => {
  // State management
  const [missingPersons, setMissingPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [filterAge, setFilterAge] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'found' or 'delete'
  const [isDeleting, setIsDeleting] = useState(false);

  // Load missing persons from Firebase
  useEffect(() => {
    const loadMissingPersons = async () => {
      try {
        console.log('🔄 Loading missing persons from Firebase...');
        const result = await getMissingPersons('active');

        let persons = result.data || [];
        
        if (result.success) {
          setMissingPersons(persons);
          console.log(`✅ Loaded ${persons.length} missing persons from Firestore`);
        } else {
          console.error('Failed to load missing persons:', result.error);
          setError(result.error || 'Failed to load missing persons');
        }
      } catch (err) {
        console.error('Error loading missing persons:', err);
        setError('Failed to connect to database');
      } finally {
        setLoading(false);
      }
    };

    loadMissingPersons();

    // Set up real-time listener for missing persons collection
    const unsubscribe = onSnapshot(
      collection(db, 'missingPersons'),
      (snapshot) => {
        console.log('🔄 Real-time update: Missing persons changed');
        const persons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastSeen: doc.data().lastSeen?.toDate() || doc.data().createdAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })).filter(person => person.status === 'active');

        setMissingPersons(persons);
        console.log(`✅ Real-time update: ${persons.length} active missing persons from Firestore`);
      },
      (error) => {
        console.error('Real-time listener error:', error);
        setError('Failed to get real-time updates');
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and sort missing persons based on search and filters
  const filteredPersons = missingPersons
    .filter((person) => {
      const matchesSearch = person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           person.lastSeenLocation?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAge = filterAge === 'all' ||
                        (filterAge === 'child' && person.age < 13) ||
                        (filterAge === 'teen' && person.age >= 13 && person.age < 18);
      const matchesGender = filterGender === 'all' || person.gender?.toLowerCase() === filterGender;

      return matchesSearch && matchesAge && matchesGender;
    })
    .sort((a, b) => {
      // Sort by lastSeen or createdAt descending (newest first)
      const dateA = a.lastSeen || a.createdAt || 0;
      const dateB = b.lastSeen || b.createdAt || 0;
      return new Date(dateB) - new Date(dateA);
    });

  // Handle successful person creation
  const handlePersonAdded = (personId) => {
    console.log(`✅ New missing person added with ID: ${personId}`);
    // Real-time listener will automatically update the list
  };

  // Handle marking person as found
  const handleMarkAsFound = async () => {
    if (!selectedPerson) return;

    setIsDeleting(true);
    
    try {
      console.log(`✓ Starting mark as found for ${selectedPerson.name}...`);
      
      // Create a promise that rejects after 20 seconds (Firebase can be slow)
      const markPromise = markPersonAsFound(selectedPerson.id, selectedPerson.name);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out after 20 seconds. Check your Firestore security rules.')), 20000)
      );
      
      const result = await Promise.race([markPromise, timeoutPromise]);
      
      console.log('Mark as found result:', result);
      
      if (result?.success) {
        console.log(`✅ Successfully marked ${selectedPerson.name} as found`);
        alert(`${selectedPerson.name} has been marked as found.`);
        setSelectedPerson(null);
        setShowConfirmDialog(false);
        setIsDeleting(false);
        // The real-time listener will update the list automatically
      } else {
        throw new Error(result?.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('❌ Error marking as found:', err);
      console.error('   Error details:', err.message);
      
      alert(`Failed to mark as found: ${err.message}\n\nPlease check the console for details and try again.`);
      
      setIsDeleting(false);
      setShowConfirmDialog(false); // Close dialog anyway
    }
  };

  // Handle deleting person record
  const handleDeletePerson = async () => {
    if (!selectedPerson) return;

    setIsDeleting(true);
    
    try {
      console.log(`🗑️ Starting delete process for ${selectedPerson.name}...`);
      
      // Create a promise that rejects after 20 seconds (Firebase can be slow)
      const deletePromise = deleteMissingPerson(selectedPerson.id, selectedPerson.name);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Delete operation timed out after 20 seconds. Check your Firestore security rules.')), 20000)
      );
      
      const result = await Promise.race([deletePromise, timeoutPromise]);
      
      console.log('Delete result:', result);
      
      if (result?.success) {
        console.log(`✅ Successfully deleted ${selectedPerson.name}`);
        alert(`${selectedPerson.name}'s record has been deleted.`);
        setSelectedPerson(null);
        setShowConfirmDialog(false);
        setIsDeleting(false);
        // The real-time listener will update the list automatically
      } else {
        throw new Error(result?.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('❌ Error during deletion:', err);
      console.error('   Error details:', err.message);
      
      // Show error to user and allow them to retry
      alert(`Failed to delete record: ${err.message}\n\nPlease check the console for details and try again.`);
      
      setIsDeleting(false);
      setShowConfirmDialog(false); // Close dialog anyway
    }
  };

  const getTimeSince = (date) => {
    if (!date) return 'Unknown';
    const hours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'found': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Add Button */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Missing Persons Registry</h1>
              <p className="text-gray-600 mt-1">
                {loading
                  ? 'Loading missing persons...'
                  : `${filteredPersons.length} of ${missingPersons.length} missing persons`
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Missing Person
          </button>
        </div>

        <p className="text-gray-600">
          Help us locate missing persons. If you have any information, please report a sighting.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Group
            </label>
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Ages</option>
              <option value="child">Child (0-12)</option>
              <option value="teen">Teen (13-17)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading missing persons...</p>
        </div>
      ) : (
        <>
          {/* Map View */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6" style={{ height: '400px' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredPersons.map((person) => (
                person.coordinates && (
                  <Marker key={person.id} position={person.coordinates}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-900">{person.name}</h3>
                        <p className="text-sm text-gray-600">{person.age} years old</p>
                        <p className="text-sm text-gray-600">{person.lastSeenLocation}</p>
                        <button
                          onClick={() => setSelectedPerson(person)}
                          className="mt-2 text-sm text-orange-600 font-medium hover:text-orange-700"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>

          {/* Missing Persons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPersons.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPerson(person)}
              >
                <div className="flex">
                  <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                        <p className="text-sm text-gray-600">
                          {person.age} years old • {person.gender}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(person.status)}`}>
                        {person.status === 'active' ? 'Missing' : person.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{person.lastSeenLocation || 'Location unknown'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Last seen {getTimeSince(person.lastSeen)}</span>
                      </div>
                    </div>
                    <button className="text-sm text-orange-600 font-medium hover:text-orange-700">
                      View Full Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredPersons.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {missingPersons.length === 0
                  ? 'No missing persons in the database yet.'
                  : 'No missing persons found matching your search criteria.'
                }
              </p>
              {missingPersons.length === 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add the first missing person →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPerson(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Missing Person Details</h2>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  {selectedPerson.photoUrl ? (
                    <img
                      src={selectedPerson.photoUrl}
                      alt={selectedPerson.name}
                      className="w-full rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400/F3F4F6/9CA3AF?text=No+Photo';
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                      <span className="text-gray-500 ml-2">No Photo Available</span>
                    </div>
                  )}

                  {/* AI Scan Status */}
                  {selectedPerson.faceEmbedding && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">AI-Ready</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Photo is ready for facial recognition scanning
                      </p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPerson.name}</h3>
                    <p className="text-gray-600">{selectedPerson.age} years old • {selectedPerson.gender}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(selectedPerson.status)}`}>
                      {selectedPerson.status === 'active' ? 'Missing' : selectedPerson.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Last Seen</h4>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {selectedPerson.lastSeen
                          ? format(selectedPerson.lastSeen, 'PPpp')
                          : 'Unknown time'
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{selectedPerson.lastSeenLocation || 'Location unknown'}</span>
                    </div>
                  </div>
                  {selectedPerson.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-600">{selectedPerson.description}</p>
                    </div>
                  )}
                  {selectedPerson.contact && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Contact Information</h4>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${selectedPerson.contact}`} className="text-orange-600 hover:text-orange-700">
                          {selectedPerson.contact}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Added {selectedPerson.createdAt ? format(selectedPerson.createdAt, 'PPp') : 'Unknown date'}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowDirections(true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-center font-medium hover:bg-green-700 flex items-center justify-center"
                      disabled={!selectedPerson?.coordinates}
                      title={!selectedPerson?.coordinates ? 'Location coordinates not available' : 'Get directions to the missing person\'s location'}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </button>
                    <a
                      href="/report"
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md text-center font-medium hover:bg-orange-700"
                    >
                      Report Sighting
                    </a>
                    <a
                      href="/ai-scanner"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-center font-medium hover:bg-blue-700"
                    >
                      AI Scan
                    </a>
                  </div>
                  
                  {/* Mark as Found / Delete Actions */}
                  <div className="flex gap-3 pt-3 border-t border-gray-200 mt-4 pt-4">
                    <button
                      onClick={() => {
                        setConfirmAction('found');
                        setShowConfirmDialog(true);
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-center font-medium hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                      title="Mark this person as found and remove from missing list"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Found
                    </button>
                    <button
                      onClick={() => {
                        setConfirmAction('delete');
                        setShowConfirmDialog(true);
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-center font-medium hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                      title="Delete this missing person record permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Directions Modal */}
      {showDirections && selectedPerson?.coordinates && (
        <GoogleMapsDirections
          location={{
            lat: selectedPerson.coordinates[0],
            lng: selectedPerson.coordinates[1],
          }}
          personName={selectedPerson.name}
          onClose={() => setShowDirections(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                {confirmAction === 'found' ? 'Mark as Found?' : 'Delete Record?'}
              </h3>
              
              <p className="mt-2 text-sm text-gray-600 text-center">
                {confirmAction === 'found' 
                  ? `Are you sure you want to mark ${selectedPerson.name} as found? This will remove them from the missing persons list.`
                  : `Are you sure you want to permanently delete the record for ${selectedPerson.name}? This action cannot be undone.`
                }
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction === 'found' ? handleMarkAsFound : handleDeletePerson}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2 text-white rounded-md font-medium ${
                    confirmAction === 'found'
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                  }`}
                >
                  {isDeleting ? 'Processing...' : (confirmAction === 'found' ? 'Mark as Found' : 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Missing Person Form */}
      <AddMissingPersonForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handlePersonAdded}
      />
    </div>
  );
};

export default MissingPersons;
