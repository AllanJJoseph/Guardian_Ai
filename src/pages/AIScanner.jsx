import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Scan, AlertCircle, CheckCircle, MapPin, Clock, Camera, Loader2, User, Users, X, Play, Target, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { scanMissingPersons, detectFace, extractFrameFromVideo } from '../services/faceRecognition';
import { addScanResult } from '../services/database';
import { format } from 'date-fns';
import exifr from 'exifr';

const AIScanner = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]); // Array of { file, preview, type, detected }
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('new-scan'); // 'new-scan' or 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadScanHistory();
    }
  }, [activeTab]);

  const loadScanHistory = async () => {
    setLoadingHistory(true);
    try {
      const { getScanResults } = await import('../services/database');
      const res = await getScanResults({ limit: 20 });
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError(null);
    setResults(null);

    const newFiles = await Promise.all(files.map(async (file) => {
      let preview = '';
      let faceDetected = false;
      let gpsCoordinates = null;

      if (file.type.startsWith('image/')) {
        preview = await new Promise(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(file);
        });
        const detection = await detectFace(preview);
        faceDetected = detection.faceDetected;

        // Extract GPS coordinates from EXIF metadata
        try {
          const exifData = await exifr.gps(file);
          if (exifData && exifData.latitude && exifData.longitude) {
            gpsCoordinates = [exifData.latitude, exifData.longitude];
            console.log(`📍 GPS extracted from ${file.name}: [${gpsCoordinates}]`);
          }
        } catch (exifErr) {
          console.log(`No GPS data in ${file.name}`);
        }
      } else if (file.type.startsWith('video/')) {
        preview = URL.createObjectURL(file);
        faceDetected = true; 
      }

      return { file, preview, type: file.type.split('/')[0], faceDetected, gpsCoordinates };
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleScan = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one image or video first');
      return;
    }

    setScanning(true);
    setScanProgress(0);
    setError(null);
    const allMatches = new Map(); // Use Map to aggregate by personId
    let totalScanned = 0;

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileData = uploadedFiles[i];
        setActiveFileIndex(i);
        
        if (fileData.type === 'image') {
          const scanResult = await scanMissingPersons(fileData.preview);
          if (scanResult.success) {
            scanResult.matches.forEach(m => {
              const existing = allMatches.get(m.personId);
              if (!existing || m.similarity > existing.similarity) {
                // Use EXIF GPS coordinates from the uploaded photo if available
                const coords = fileData.gpsCoordinates || m.coordinates;
                allMatches.set(m.personId, { ...m, sourceFile: fileData.file.name, coordinates: coords });
              }
            });
            totalScanned += scanResult.totalScanned;
          }
        } else if (fileData.type === 'video') {
          // Process video frames
          const video = document.createElement('video');
          video.src = fileData.preview;
          await new Promise(res => { video.onloadedmetadata = res; });
          const duration = video.duration;
          const interval = 2; // Scan every 2 seconds
          
          for (let t = 0; t < duration; t += interval) {
            const frameCanvas = await extractFrameFromVideo(fileData.file, t);
            const frameDataUrl = frameCanvas.toDataURL('image/jpeg', 0.8);
            const scanResult = await scanMissingPersons(frameDataUrl);
            
            if (scanResult.success) {
              scanResult.matches.forEach(m => {
                const existing = allMatches.get(m.personId);
                if (!existing || m.similarity > existing.similarity) {
                  allMatches.set(m.personId, { ...m, sourceFile: fileData.file.name, timestamp: t });
                }
              });
              if (t === 0) totalScanned += scanResult.totalScanned; // Only count base population once
            }
            setScanProgress(Math.round(((i + (t / duration)) / uploadedFiles.length) * 100));
          }
        }
        setScanProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
      }

      const finalMatches = Array.from(allMatches.values()).sort((a, b) => b.similarity - a.similarity);
      
      setResults({
        success: true,
        matches: finalMatches,
        totalScanned: totalScanned,
        matchesFound: finalMatches.length
      });

      // Save results to database
      await Promise.all(finalMatches.map(async (match) => {
        try {
          await addScanResult({
            personId: match.personId || match.id,
            similarity: match.similarity,
            confidence: match.confidence,
            uploadedImageUrl: match.photoUrl || '', // Or current frame?
            scannedPersonName: match.name,
            timestamp: new Date(),
            reportedBy: 'ai_scanner',
            location: match.location,
            coordinates: match.coordinates
          });
        } catch (e) { console.error(e); }
      }));

    } catch (err) {
      setError('An error occurred during scanning: ' + err.message);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
      setScanProgress(100);
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 85) return 'text-green-600 bg-green-50';
    if (similarity >= 70) return 'text-blue-600 bg-blue-50';
    if (similarity >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-orange-100 text-orange-800 border-orange-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${colors[confidence]}`}>
        {confidence.toUpperCase()} CONFIDENCE
      </span>
    );
  };

  // Calculate Prediction Center and Radius
  const predictionData = useMemo(() => {
    if (!results || results.matches.length === 0) return null;
    
    // Filter matches that have coordinates
    const locations = results.matches
      .filter(m => m.coordinates && Array.isArray(m.coordinates) && m.coordinates.length === 2)
      .map(m => m.coordinates);
    
    if (locations.length === 0) return null;
    
    // Simple centroid calculation
    const center = locations.reduce(
      (acc, curr) => [acc[0] + curr[0] / locations.length, acc[1] + curr[1] / locations.length],
      [0, 0]
    );
    
    // Calculate radius (max distance from center + padding) or default 5km
    let maxDist = 5000; // meters
    locations.forEach(loc => {
      const dist = L.latLng(center).distanceTo(L.latLng(loc));
      if (dist > maxDist) maxDist = dist;
    });
    
    return { center, radius: maxDist + 2000 }; // Add 2km padding
  }, [results]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4 sm:mb-0 sm:mr-4">
              <Scan className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Video & Photo Scanner</h1>
              <p className="text-slate-600">Scan multiple files and videos to track missing person movements</p>
            </div>
          </div>
        </div>

        {/* Tabs for Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('new-scan')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === 'new-scan'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            New Intelligence Scan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Intelligence History
          </button>
        </div>

        {activeTab === 'new-scan' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ... Upload Section ... */}
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-slate-200 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Media</h2>

              {/* Upload Area */}
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Click to upload files</p>
                  <p className="text-xs text-slate-500">Add multiple photos or videos</p>
                </label>
              </div>

              {/* File List / Gallery */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    Files to Scan ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedFiles.map((fileData, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        {fileData.type === 'image' ? (
                          <img src={fileData.preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                            <Play className="h-6 w-6 opacity-50" />
                          </div>
                        )}
                        <button 
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {fileData.faceDetected && (
                          <div className="absolute bottom-1 left-1 bg-green-500 p-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Scan Button / Progress */}
              <div className="space-y-4">
                <button
                  onClick={handleScan}
                  disabled={uploadedFiles.length === 0 || scanning}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-all ${
                    uploadedFiles.length === 0 || scanning
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Scanning ({scanProgress}%)
                    </>
                  ) : (
                    <>
                      <Scan className="h-5 w-5 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </button>

                {scanning && (
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-300" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Info */}
              <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                <h3 className="text-sm font-semibold text-primary-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-1.5" />
                  Advanced Analysis
                </h3>
                <ul className="text-xs text-primary-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-1.5">•</span>
                    <span>Processes video frames every 2 seconds for high-speed tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5">•</span>
                    <span>Cross-references all registered missing persons</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5">•</span>
                    <span>Plots discovered locations and predicts target area radius</span>
                  </li>
                </ul>
              </div>
            </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {results && (
              <div className="space-y-6">
                {/* Statistics & Prediction Map */}
                <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Intelligence Report</h2>
                      <p className="text-sm text-slate-500">
                        {results.matchesFound} matches identified across {uploadedFiles.length} files
                      </p>
                    </div>
                    {predictionData && (
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                          <Target className="h-3 w-3 mr-1" />
                          Area Predicted
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Map Integration */}
                  {predictionData ? (
                    <div className="h-[400px] w-full relative z-0 border-b border-slate-100">
                      <MapContainer 
                        center={predictionData.center} 
                        zoom={12} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {/* Discovery Points */}
                        {results.matches.filter(m => m.coordinates).map((match, idx) => (
                          <Marker key={idx} position={match.coordinates}>
                            <Popup>
                              <div className="p-1">
                                <p className="font-bold text-slate-900">{match.name}</p>
                                <p className="text-xs text-slate-600 mb-1">{match.location}</p>
                                <div className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded inline-block font-bold">
                                  {match.similarity}% MATCH
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                        {/* Prediction Area */}
                        <Circle 
                          center={predictionData.center} 
                          radius={predictionData.radius}
                          pathOptions={{ 
                            color: '#6366f1', 
                            fillColor: '#6366f1', 
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '5, 10'
                          }} 
                        />
                        <Marker position={predictionData.center} icon={L.divIcon({
                          className: 'prediction-center',
                          html: '<div class="w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow-lg animate-ping"></div>',
                          iconSize: [16, 16]
                        })} />
                      </MapContainer>
                      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-soft border border-slate-200">
                        <p className="text-xs font-bold text-slate-800 flex items-center">
                          <div className="w-3 h-3 bg-primary-600/20 border border-primary-600 border-dashed rounded-full mr-2"></div>
                          Estimated Search Radius: {(predictionData.radius / 1000).toFixed(1)} km
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-b border-slate-100">
                      <MapPin className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">No geolocation data available for matches</p>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {results.matches.slice(0, 5).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden shadow-sm">
                            <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 italic">
                        * Results based on {results.totalScanned} records scanning
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match List */}
                <div className="space-y-4">
                  {results.matches.map((match) => (
                    <div key={match.id || match.personId} className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden hover:shadow-medium transition-shadow">
                      <div className="md:flex">
                        <div className="md:w-1/3 bg-slate-100 relative h-48 md:h-auto">
                          <img src={match.photoUrl} alt={match.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 bg-primary-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {match.similarity}% Similarity
                          </div>
                          {match.timestamp !== undefined && (
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-medium">
                              Found at {format(new Date(match.timestamp * 1000), 'mm:ss')} in video
                            </div>
                          )}
                        </div>
                        <div className="md:w-2/3 p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 leading-tight">{match.name}</h3>
                              <p className="text-sm text-slate-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {match.location}
                              </p>
                            </div>
                            {getConfidenceBadge(match.confidence)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                            <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
                              <User className="h-3 w-3 mr-1" /> {match.age}y
                            </span>
                            <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
                              <Clock className="h-3 w-3 mr-1" /> Logged {format(new Date(), 'MMM d')}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => window.open(`/missing-persons?person=${match.id || match.personId}`, '_blank')}
                              className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                              View Profile
                            </button>
                            <button onClick={() => window.open('/report', '_blank')}
                               className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                              Report Sighting
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results && results.matches.length === 0 && (
              <div className="bg-white rounded-2xl shadow-soft p-12 border border-slate-200 text-center">
                <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Clear Matches Found</h3>
                <p className="text-slate-600 mb-6 font-medium">
                  Analysis of {uploadedFiles.length} media files returned no high-confidence profile matches.
                </p>
                <div className="max-w-xs mx-auto text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-6">
                  Recommendation: Try uploading higher resolution media or files with better facial visibility from different angles.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
          /* History View */
          <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Archived Intelligence Results</h2>
              <p className="text-sm text-slate-500">Recently saved AI match records</p>
            </div>
            
            {loadingHistory ? (
              <div className="p-12 text-center">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Retrieving intelligence archives...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden">
                        <img src={item.uploadedImageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-slate-900">{item.scannedPersonName}</h3>
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">
                            {item.similarity}% MATCH
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location || 'Unknown Location'} • {format(item.createdAt.toDate(), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setResults({ matches: [item], matchesFound: 1, totalScanned: 'N/A' });
                        setActiveTab('new-scan');
                      }}
                      className="px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No archived intelligence found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIScanner;
