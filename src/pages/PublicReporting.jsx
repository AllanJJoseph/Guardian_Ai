import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Upload, Send, CheckCircle } from 'lucide-react';
import { addReport, getMissingPersons } from '../services/database';
import { uploadImage, compressImageToBase64 } from '../services/faceRecognition';

const PublicReporting = () => {
  const [formData, setFormData] = useState({
    personId: '',
    description: '',
    location: '',
    date: '',
    time: '',
    additionalInfo: ''
  });
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [missingPersons, setMissingPersons] = useState([]);

  // Load real missing persons from Firestore
  useEffect(() => {
    getMissingPersons('active').then(result => {
      if (result.success && result.data) {
        setMissingPersons(result.data);
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...imageUrls]);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setCurrentLocation(location);
          setFormData({ ...formData, location });
        },
        () => alert('Unable to get location. Please enter manually.')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload images to Firebase Storage with Base64 fallback
      const uploadedUrls = [];
      for (const file of imageFiles) {
        try {
          // Attempt Storage upload with a shorter timeout
          const uploadPromise = uploadImage(file, 'sighting-reports');
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 10000)
          );
          
          const result = await Promise.race([uploadPromise, timeoutPromise]);
          if (result.success) {
            uploadedUrls.push(result.url);
          } else {
            throw new Error(result.error || 'Storage upload failed');
          }
        } catch (storageErr) {
          console.warn('⚠️ Sighting photo storage failed. Using Base64 fallback...', storageErr);
          try {
            const base64 = await compressImageToBase64(file, 400, 0.5);
            uploadedUrls.push(base64);
          } catch (compressErr) {
            console.error('❌ Could not fallback to Base64:', compressErr);
          }
        }
      }

      // Save report to Firestore
      const reportData = {
        personId: formData.personId || null,
        personName: missingPersons.find(p => p.id === formData.personId)?.name || null,
        description: formData.description,
        location: formData.location,
        coordinates: currentLocation ? currentLocation.split(',').map(Number) : null,
        date: formData.date,
        time: formData.time,
        additionalInfo: formData.additionalInfo,
        photos: uploadedUrls,
        status: 'pending',
        source: 'website',
      };

      const result = await addReport(reportData);
      if (!result.success) throw new Error(result.error);

      console.log('✅ Report saved to Firestore:', result.id);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ personId: '', description: '', location: '', date: '', time: '', additionalInfo: '' });
        setImages([]);
        setImageFiles([]);
        setCurrentLocation(null);
      }, 3000);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your contribution. Your report has been forwarded to relevant authorities and NGOs.
          </p>
          <button onClick={() => setSubmitted(false)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report a Sighting</h1>
        <p className="text-gray-600">
          Help us locate missing persons by reporting any sightings with as much detail as possible
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Person Selection — from real Firestore data */}
        <div>
          <label htmlFor="personId" className="block text-sm font-semibold text-gray-900 mb-2">
            Missing Person (Optional)
          </label>
          <select id="personId" name="personId" value={formData.personId} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Select a missing person or leave blank</option>
            {missingPersons.map(person => (
              <option key={person.id} value={person.id}>{person.name} - {person.age} years old</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            If you're reporting a suspicious activity, you can leave this blank
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea id="description" name="description" rows="4" required value={formData.description} onChange={handleChange}
            placeholder="Describe what you saw, including physical appearance, clothing, behavior..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
            Location <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input type="text" id="location" name="location" required value={formData.location} onChange={handleChange}
              placeholder="Enter address or landmark"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button type="button" onClick={getCurrentLocation}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center">
              <MapPin className="h-5 w-5 mr-1" /> Use Current
            </button>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
              Date <span className="text-red-600">*</span>
            </label>
            <input type="date" id="date" name="date" required value={formData.date} onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-semibold text-gray-900 mb-2">
              Time <span className="text-red-600">*</span>
            </label>
            <input type="time" id="time" name="time" required value={formData.time} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Photos/Videos (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input type="file" accept="image/*,video/*" multiple onChange={handleImageUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload photos or videos</p>
              <p className="text-xs text-gray-500">PNG, JPG, MP4 up to 10MB</p>
            </label>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img src={image} alt={`Upload ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-semibold text-gray-900 mb-2">
            Additional Information (Optional)
          </label>
          <textarea id="additionalInfo" name="additionalInfo" rows="3" value={formData.additionalInfo} onChange={handleChange}
            placeholder="Any other details like vehicle information, companions, direction of movement, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={isSubmitting}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:bg-gray-400">
            {isSubmitting ? (
              <><span className="animate-spin mr-2">⏳</span> Submitting...</>
            ) : (
              <><Send className="h-5 w-5 mr-2" /> Submit Report</>
            )}
          </button>
          <button type="button" onClick={() => { setFormData({ personId: '', description: '', location: '', date: '', time: '', additionalInfo: '' }); setImages([]); setImageFiles([]); }}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-semibold">
            Clear
          </button>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Important:</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Provide accurate information to help authorities</li>
            <li>Do not approach the person if you suspect danger</li>
            <li>Contact emergency services (112) if immediate help is needed</li>
            <li>Your identity will be kept confidential if requested</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default PublicReporting;
