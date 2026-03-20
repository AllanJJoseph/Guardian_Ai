import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  User,
  MapPin,
  Calendar,
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { uploadImage, compressImageToBase64, generateFaceEmbedding } from '../services/faceRecognition';
import { addMissingPerson, updateMissingPerson } from '../services/database';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Map click handler component
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const AddMissingPersonForm = ({ isOpen, onClose, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    description: '',
    lastSeenLocation: '',
    coordinates: null,
    contact: ''
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState(''); // '', 'uploading', 'converting', 'analyzing', 'saving'
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

  const fileInputRef = useRef(null);

  // Get user location for map centering
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {} // Silently fail, keep default India center
      );
    }
  }, [isOpen]);

  // Handle image selection (no face validation - just preview)
  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => handleImageUpload(e.target.files[0]);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMapClick = (coords) => {
    setFormData(prev => ({ ...prev, coordinates: coords }));
    // Reverse geocode to fill location text
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`)
      .then(r => r.json())
      .then(data => {
        if (data?.display_name) {
          setFormData(prev => ({ ...prev, lastSeenLocation: data.display_name.split(',').slice(0, 3).join(',') }));
        }
      })
      .catch(() => {});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) { setError('Name is required'); return; }
    if (!formData.age || formData.age < 1) { setError('Valid age is required'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      let photoUrl = null;

      let faceEmbedding = null;

      // Step 1: Upload photo first (if selected)
      if (selectedImage) {
        // Step 1a: Analysing face for AI matching
        setSubmitStage('analyzing');
        console.log('Generating face embedding...');
        try {
          const embResult = await generateFaceEmbedding(selectedImage);
          if (embResult.success) {
            faceEmbedding = embResult.embedding;
            console.log('✅ Face embedding generated');
          } else {
            console.warn('⚠️ Could not generate face embedding:', embResult.error);
          }
        } catch (err) {
          console.error('❌ Error in face analysis:', err);
        }

        // Step 1b: Upload to Storage
        setSubmitStage('uploading');
        console.log('Uploading photo to Storage...');
        
        try {
          // Attempt Storage upload with timeout
          const uploadPromise = uploadImage(selectedImage, `missing-persons/profile`);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 15000)
          );

          const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          
          if (uploadResult.success) {
            photoUrl = uploadResult.url;
          } else {
            throw new Error(uploadResult.error || 'Storage upload failed');
          }
        } catch (storageErr) {
          console.warn('⚠️ Storage upload failed. Using Base64 fallback...', storageErr);
          setSubmitStage('converting');
          try {
            photoUrl = await compressImageToBase64(selectedImage, 400, 0.6);
          } catch (compressErr) {
            console.error('❌ Base64 conversion failed:', compressErr);
          }
        }
      }

      // Step 2: Create missing person record
      setSubmitStage('saving');
      const personData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        description: formData.description.trim(),
        lastSeenLocation: formData.lastSeenLocation.trim(),
        coordinates: formData.coordinates,
        contact: formData.contact.trim(),
        photoUrl: photoUrl,
        faceEmbedding: faceEmbedding,
        status: 'active',
        createdAt: new Date(),
        reportedAt: new Date()
      };

      console.log('Creating missing person record...');
      const personResult = await addMissingPerson(personData);
      
      if (!personResult.success) {
        throw new Error(personResult.error || 'Failed to create record');
      }

      console.log(`✅ Missing person created successfully! ID: ${personResult.id}`);

      // Reset form and close
      setFormData({ name: '', age: '', gender: 'Male', description: '', lastSeenLocation: '', coordinates: null, contact: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setSubmitStage('');

      onSuccess?.(personResult.id);
      onClose();

    } catch (error) {
      console.error('Error creating missing person:', error);
      setError(error.message || 'Failed to create missing person. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitStage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center">
            <div className="relative mr-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-xl blur opacity-25"></div>
              <img src="/guardian-ai-logo.png" alt="Guardian AI" className="relative h-10 w-10 rounded-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">ADD MISSING PROFILE</h2>
              <p className="text-[10px] font-bold text-primary-600 tracking-widest uppercase mt-0.5">Intel Registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Photo (optional)</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <div className="space-y-1">
                  <Camera className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age <span className="text-red-500">*</span></label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange}
                min="1" max="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Age" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
              <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+91 99999 99999" />
            </div>
          </div>

          {/* Last Seen Location + Map Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Last Seen Location — click the map to set exact coordinates
            </label>
            <input type="text" name="lastSeenLocation" value={formData.lastSeenLocation} onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
              placeholder="e.g., Connaught Place Metro Station" />
            <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: '250px' }}>
              <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <LocationPicker position={formData.coordinates} setPosition={handleMapClick} />
              </MapContainer>
            </div>
            {formData.coordinates && (
              <p className="text-xs text-green-600 mt-1">
                📍 Coordinates set: {formData.coordinates[0].toFixed(6)}, {formData.coordinates[1].toFixed(6)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Physical description, clothing, distinguishing features..." />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors min-w-[160px] justify-center">
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="relative h-4 w-4">
                    <Loader2 className="absolute inset-0 h-4 w-4 animate-spin" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {submitStage === 'analyzing' ? 'Face Mapping...' :
                     submitStage === 'uploading' ? 'Syncing Media...' : 
                     submitStage === 'converting' ? 'Optimizing...' :
                     submitStage === 'saving' ? 'Writing Intel...' : 
                     'Processing...'}
                  </span>
                </div>
              ) : (
                <><ShieldCheck className="h-4 w-4 mr-2" /> <span className="uppercase tracking-widest font-black text-xs">Register Profile</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMissingPersonForm;